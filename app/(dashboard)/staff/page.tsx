import { requirePermission } from "@/lib/auth/session";
import { InlineFilters, TablePager } from "@/components/ui/ListToolbar";
import { TeachersProvider, NewTeacherButton, type TeacherRow } from "@/components/staff/TeachersProvider";
import { TeachersTable, type TeacherListRow } from "@/components/staff/TeachersTable";
import { ROLE_LABELS, isRole } from "@/lib/auth/permissions";
import { readPaging } from "@/lib/paging";
import { isBuiltinOverride } from "@/lib/permission-catalog";
import { STAFF_LEAVE_REASONS, TEACHER_KIND_LABELS, TEACHER_KINDS } from "@/lib/validations/staff";

/** Xodimlar (Edu tizimdagi "Xodimlar"): filtrlar, o'quvchi va guruh soni, filiallar. */
export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePermission("staff.manage");

  const [teachersRes, groupsRes, studentsRes, membersRes, rolesRes, branchesRes] = await Promise.all([
    supabase.from("teachers").select("*").order("is_active", { ascending: false }).order("full_name"),
    supabase.from("groups").select("id, name, teacher_id, course:courses(id, name)"),
    supabase.from("students").select("group_id").eq("status", "active"),
    supabase.from("org_members").select("employee_id, role, custom_role_id"),
    supabase.from("org_roles").select("id, name, permissions"),
    supabase.from("branches").select("id, name").order("name"),
  ]);

  const groups = (groupsRes.data ?? []) as unknown as {
    id: string;
    name: string;
    teacher_id: string | null;
    course: { id: string; name: string } | null;
  }[];
  const branches = branchesRes.data ?? [];
  const branchName = new Map(branches.map((b) => [b.id as string, b.name as string]));
  const customRoles = ((rolesRes.data ?? []) as { id: string; name: string; permissions: string[] | null }[]).filter(
    (r) => !isBuiltinOverride(r.permissions),
  );

  const studentsByGroup = new Map<string, number>();
  for (const s of studentsRes.data ?? []) {
    if (s.group_id) studentsByGroup.set(s.group_id, (studentsByGroup.get(s.group_id) ?? 0) + 1);
  }
  // Xodimning tizimdagi roli (login berilgan bo'lsa): maxsus rol yoki tayyor rol.
  const roleByEmployee = new Map<string, string>();
  for (const m of (membersRes.data ?? []) as { employee_id: string | null; role: string; custom_role_id?: string | null }[]) {
    if (!m.employee_id) continue;
    roleByEmployee.set(m.employee_id, m.custom_role_id ? `custom:${m.custom_role_id}` : `role:${m.role}`);
  }

  const rows: (TeacherListRow & { roleKey: string | null; courseIds: string[] })[] = (
    (teachersRes.data ?? []) as TeacherRow[]
  ).map((t) => {
    const own = groups.filter((g) => g.teacher_id === t.id);
    return {
      ...t,
      groupNames: own.map((g) => g.name),
      studentCount: own.reduce((sum, g) => sum + (studentsByGroup.get(g.id) ?? 0), 0),
      branchNames: (t.branch_ids ?? []).map((id) => branchName.get(id)).filter((n): n is string => Boolean(n)),
      roleKey: roleByEmployee.get(t.id) ?? null,
      courseIds: own.flatMap((g) => (g.course ? [g.course.id] : [])),
    };
  });

  const q = params.q?.trim().toLowerCase();
  const filtered = rows.filter((t) => {
    if (q && !`${t.full_name} ${t.phone ?? ""}`.toLowerCase().includes(q)) return false;
    if (params.status === "active" && !t.is_active) return false;
    if (params.status === "inactive" && t.is_active) return false;
    if (params.kind && t.kind !== params.kind) return false;
    if (params.role && t.roleKey !== params.role) return false;
    if (params.course && !t.courseIds.includes(params.course)) return false;
    if (params.branch && !(t.branch_ids ?? []).includes(params.branch)) return false;
    if (params.joined && (t.created_at ?? "").slice(0, 10) !== params.joined) return false;
    if (params.left && t.left_on !== params.left) return false;
    // Faollik sanasi: shu kunda xodim ishlab turgan bo'lishi kerak (qo'shilgan va hali ketmagan).
    if (params.active_on) {
      if ((t.created_at ?? "").slice(0, 10) > params.active_on) return false;
      if (t.left_on && t.left_on < params.active_on) return false;
    }
    if (params.reason && t.leave_reason !== params.reason) return false;
    return true;
  });

  const { page, size } = readPaging(params);
  const current = Math.min(page, Math.max(1, Math.ceil(filtered.length / size)));
  const offset = (current - 1) * size;
  const visible = filtered.slice(offset, offset + size);

  const courses = [...new Map(groups.filter((g) => g.course).map((g) => [g.course!.id, g.course!.name])).entries()];

  return (
    <TeachersProvider>
      <div className="space-y-3">
        {teachersRes.error && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Xodim kartasi ustunlari bazada topilmadi — yangi migratsiyalarni (yangi-migratsiyalar.sql) Supabase SQL
            Editor&apos;da ishga tushiring.
          </p>
        )}

        <InlineFilters
          storageKey="staff"
          actions={<NewTeacherButton />}
          fields={[
            { name: "q", label: "Qidiruv", type: "text" },
            {
              name: "status",
              label: "Holat",
              type: "select",
              options: [
                { value: "active", label: "Faol" },
                { value: "inactive", label: "Nofaol" },
              ],
            },
            { name: "active_on", label: "Faollik sanasi", type: "date" },
            { name: "left", label: "Ketish sanasi", type: "date" },
            {
              name: "role",
              label: "Rol",
              type: "select",
              options: [
                ...(["owner", "manager", "teacher", "accountant"] as const).filter(isRole).map((r) => ({
                  value: `role:${r}`,
                  label: ROLE_LABELS[r],
                })),
                ...customRoles.map((r) => ({ value: `custom:${r.id}`, label: r.name })),
              ],
            },
            {
              name: "kind",
              label: "Turi",
              type: "select",
              options: TEACHER_KINDS.map((k) => ({ value: k, label: TEACHER_KIND_LABELS[k] })),
            },
            { name: "course", label: "Kurs", type: "select", options: courses.map(([value, label]) => ({ value, label })) },
            {
              name: "reason",
              label: "Ketish sababi",
              type: "select",
              options: STAFF_LEAVE_REASONS.map((r) => ({ value: r, label: r })),
            },
            { name: "joined", label: "Qo'shilgan sana", type: "date" },
            {
              name: "branch",
              label: "Filial",
              type: "select",
              options: branches.map((b) => ({ value: b.id as string, label: b.name as string })),
            },
          ]}
        />

        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="flex justify-end px-4 py-3">
            <span className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink-muted">
              Umumiy soni <b className="ml-1 text-ink">{filtered.length}</b>
            </span>
          </div>
          <TeachersTable teachers={visible} offset={offset} />
          <TablePager total={filtered.length} page={current} size={size} />
        </div>
      </div>
    </TeachersProvider>
  );
}
