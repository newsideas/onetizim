import { Inbox } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { GroupAssignCell } from "@/components/groups/GroupAssignCell";
import { InlineFilters, TablePager, type InlineField } from "@/components/ui/ListToolbar";
import { readPaging } from "@/lib/paging";
import { termsFor } from "@/lib/segment";
import { toIsoDay } from "@/lib/utils/date";

const TH = "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase";

interface StudentQueryRow {
  id: string;
  full_name: string;
  status: string;
  created_at: string;
  group_id: string | null;
  group: {
    name: string;
    status: string;
    teacher_id: string | null;
    teacher: { full_name: string } | null;
  } | null;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: {
    label: "Aktiv",
    className: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300",
  },
  frozen: {
    label: "Muzlatilgan",
    className: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  },
  archived: { label: "Arxiv", className: "bg-canvas text-ink-muted" },
};

export default async function GroupStudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, org, permissions } = await requirePermission("students.view");
  const terms = termsFor(org.type);
  const canAssign = permissions.includes("students.manage");

  const [studentsRes, groupsRes, teachersRes] = await Promise.all([
    supabase
      .from("students")
      .select(
        "id, full_name, status, created_at, group_id, " +
          "group:groups(name, status, teacher_id, teacher:teachers(full_name))",
      )
      .neq("status", "archived")
      .order("created_at", { ascending: true }),
    supabase.from("groups").select("id, name").order("name"),
    supabase.from("teachers").select("id, full_name").order("full_name"),
  ]);

  // ID — o'quvchi tizimga qo'shilgan tartib raqami (yaratilish sanasi bo'yicha).
  const all = ((studentsRes.data ?? []) as unknown as StudentQueryRow[]).map((s, i) => ({
    ...s,
    seq: i + 1,
  }));

  const q = params.q?.trim().toLowerCase();
  const rows = all
    .filter((s) => {
      if (params.frozen === "1" && s.status !== "frozen") return false;
      if (q && !s.full_name.toLowerCase().includes(q)) return false;
      if (params.teacher && s.group?.teacher_id !== params.teacher) return false;
      if (params.groupStatus && s.group?.status !== params.groupStatus) return false;
      const created = toIsoDay(s.created_at);
      if (params.from && created < params.from) return false;
      if (params.to && created > params.to) return false;
      return true;
    })
    .reverse(); // eng yangilari tepada

  const { page, size } = readPaging(params);
  const current = Math.min(page, Math.max(1, Math.ceil(rows.length / size)));
  const offset = (current - 1) * size;
  const visible = rows.slice(offset, offset + size);
  const groups = groupsRes.data ?? [];

  const fields: InlineField[] = [
    { name: "q", label: "Qidiruv", type: "text" },
    { name: "frozen", label: "Muzlatilgan", type: "toggle", width: "w-36" },
    {
      name: "teacher",
      label: terms.teacher,
      type: "select",
      options: (teachersRes.data ?? []).map((t) => ({ value: t.id, label: t.full_name })),
    },
    {
      name: "groupStatus",
      label: `${terms.group} holati`,
      type: "select",
      options: [
        { value: "active", label: "Aktiv" },
        { value: "waiting", label: "Kutilmoqda" },
        { value: "archived", label: "Arxiv" },
      ],
    },
    { name: "from", label: "Sanadan", type: "date", width: "w-40" },
    { name: "to", label: "Sanagacha", type: "date", width: "w-40" },
  ];

  return (
    <div className="space-y-3">
      {studentsRes.error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Bazada kerakli jadval yoki ustun topilmadi — 0042_group_module.sql migratsiyasini Supabase
          SQL Editor&apos;da ishga tushiring.
        </p>
      )}
      <InlineFilters storageKey="group-students" fields={fields} />

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex justify-end px-4 py-3">
          <span className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink-muted">
            Umumiy soni <b className="ml-1 text-ink">{rows.length}</b>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas">
              <tr>
                <th className={`${TH} w-12`}>№</th>
                <th className={TH}>ID</th>
                <th className={TH}>Ism</th>
                <th className={TH}>{terms.groupPlural}</th>
                <th className={TH}>{terms.teacher}</th>
                <th className={TH}>Holati</th>
                {canAssign && <th className={TH}>Biriktirish</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={canAssign ? 7 : 6} className="px-4 py-16 text-center">
                    <Inbox size={22} className="mx-auto mb-2 text-ink-faint" aria-hidden="true" />
                    <div className="text-sm font-medium text-ink-muted">Ma&apos;lumotlar topilmadi</div>
                    <div className="mt-0.5 text-xs text-ink-faint">
                      Ma&apos;lumotlar topilmadi. Filterni o&apos;zgartirib ko&apos;ring.
                    </div>
                  </td>
                </tr>
              ) : (
                visible.map((s, i) => {
                  const badge = STATUS_BADGE[s.status] ?? STATUS_BADGE.active;
                  return (
                    <tr key={s.id} className="hover:bg-canvas">
                      <td className="px-4 py-3 text-ink-faint">{offset + i + 1}</td>
                      <td className="px-4 py-3 text-ink-muted">{s.seq}</td>
                      <td className="px-4 py-3 font-medium text-ink">{s.full_name}</td>
                      <td className="px-4 py-3 text-ink-muted">{s.group?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-ink-muted">{s.group?.teacher?.full_name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      {canAssign && (
                        <td className="px-4 py-3">
                          <GroupAssignCell
                            studentId={s.id}
                            currentGroupId={s.group_id}
                            groups={groups}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <TablePager total={rows.length} page={current} size={size} />
      </div>
    </div>
  );
}
