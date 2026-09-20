import Link from "next/link";
import { Inbox } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { BalanceBadge } from "@/components/payments/BalanceBadge";
import { StudentStatusBadge } from "@/components/students/StudentStatusBadge";
import { NewStudentButton } from "@/components/students/NewStudentButton";
import { InlineFilters, TablePager, type InlineField } from "@/components/ui/ListToolbar";
import { readPaging } from "@/lib/paging";
import { termsFor } from "@/lib/segment";
import { formatSom } from "@/lib/utils/currency";
import { formatDate, toIsoDay } from "@/lib/utils/date";
import type { StudentStatus } from "@/types/database";

/**
 * O'quvchilar ro'yxatining to'rt ko'rinishi (Edu tizimdagi kabi):
 * new — shu oy qo'shilganlar, active — aktiv, archived — arxiv, all — to'liq baza.
 */
export type StudentView = "new" | "active" | "archived" | "all";

const TH = "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase";

interface StudentQueryRow {
  id: string;
  full_name: string;
  phone: string | null;
  balance: number;
  status: StudentStatus;
  gender: string | null;
  birth_date: string | null;
  created_at: string;
  archived_at?: string | null;
  group_id: string | null;
  group: {
    name: string;
    course_id: string | null;
    teacher_id: string | null;
    teacher: { full_name: string } | null;
  } | null;
}

const VIEW_STATUS: Record<StudentView, StudentStatus[] | null> = {
  new: ["active", "frozen"],
  active: ["active"],
  archived: ["archived"],
  all: null,
};

export async function StudentList({
  view,
  params,
}: {
  view: StudentView;
  params: Record<string, string | undefined>;
}) {
  const { supabase, org, permissions } = await requirePermission("students.view");
  const terms = termsFor(org.type);
  const canManage = permissions.includes("students.manage");

  const [studentsRes, groupsRes, teachersRes, coursesRes, paymentsRes] = await Promise.all([
    supabase
      .from("students")
      .select(
        "id, full_name, phone, balance, status, gender, birth_date, created_at, archived_at, group_id, " +
          "group:groups(name, course_id, teacher_id, teacher:teachers(full_name))",
      )
      .order("created_at", { ascending: true }),
    supabase.from("groups").select("id, name").order("name"),
    supabase.from("teachers").select("id, full_name").order("full_name"),
    supabase.from("courses").select("id, name").order("name"),
    supabase
      .from("payments")
      .select("student_id, paid_at")
      .order("paid_at", { ascending: false })
      .limit(5000),
  ]);

  // Migratsiya (0041) qo'llanmagan bo'lsa archived_at yo'q — ro'yxat baribir ishlashi kerak.
  let rowsRaw = studentsRes.data;
  if (studentsRes.error) {
    const fallback = await supabase
      .from("students")
      .select(
        "id, full_name, phone, balance, status, gender, birth_date, created_at, group_id, " +
          "group:groups(name, course_id, teacher_id, teacher:teachers(full_name))",
      )
      .order("created_at", { ascending: true });
    rowsRaw = fallback.data;
  }

  // ID — o'quvchi tizimga qo'shilgan tartib raqami.
  const all = ((rowsRaw ?? []) as unknown as StudentQueryRow[]).map((s, i) => ({ ...s, seq: i + 1 }));

  const lastPayment = new Map<string, string>();
  for (const p of (paymentsRes.data ?? []) as { student_id: string; paid_at: string }[]) {
    if (!lastPayment.has(p.student_id)) lastPayment.set(p.student_id, p.paid_at);
  }

  const monthStart = `${toIsoDay(new Date()).slice(0, 7)}-01`;
  const viewStatuses = VIEW_STATUS[view];
  const q = params.q?.trim().toLowerCase();

  const rows = all
    .filter((s) => {
      if (viewStatuses && !viewStatuses.includes(s.status)) return false;
      if (view === "new" && toIsoDay(s.created_at) < monthStart) return false;
      if (view === "all" && params.status && s.status !== params.status) return false;
      if (q && !`${s.full_name} ${s.phone ?? ""}`.toLowerCase().includes(q)) return false;
      const created = toIsoDay(s.created_at);
      if (params.from && created < params.from) return false;
      if (params.to && created > params.to) return false;
      if (params.balance === "debt" && !(Number(s.balance) < 0)) return false;
      if (params.balance === "credit" && !(Number(s.balance) > 0)) return false;
      if (params.balance === "zero" && Number(s.balance) !== 0) return false;
      if (params.group && s.group_id !== params.group) return false;
      if (params.teacher && s.group?.teacher_id !== params.teacher) return false;
      if (params.course && s.group?.course_id !== params.course) return false;
      if (params.gender && s.gender !== params.gender) return false;
      if (params.birth && s.birth_date !== params.birth) return false;
      return true;
    })
    .reverse(); // eng yangilari tepada

  const debt = rows.reduce((sum, s) => sum + (Number(s.balance) < 0 ? -Number(s.balance) : 0), 0);
  const credit = rows.reduce((sum, s) => sum + (Number(s.balance) > 0 ? Number(s.balance) : 0), 0);

  const { page, size } = readPaging(params);
  const current = Math.min(page, Math.max(1, Math.ceil(rows.length / size)));
  const offset = (current - 1) * size;
  const visible = rows.slice(offset, offset + size);

  const fields: InlineField[] = [
    { name: "q", label: "Qidiruv", type: "text" },
    { name: "from", label: "Sanadan", type: "date", width: "w-40" },
    { name: "to", label: "Sanagacha", type: "date", width: "w-40" },
    {
      name: "balance",
      label: "Balans",
      type: "select",
      options: [
        { value: "debt", label: "Qarzdor" },
        { value: "credit", label: "Haqdor" },
        { value: "zero", label: "Nol balans" },
      ],
    },
    {
      name: "course",
      label: "Kurs",
      type: "select",
      options: (coursesRes.data ?? []).map((c) => ({ value: c.id, label: c.name })),
    },
    {
      name: "group",
      label: terms.group,
      type: "select",
      options: (groupsRes.data ?? []).map((g) => ({ value: g.id, label: g.name })),
    },
    {
      name: "teacher",
      label: terms.teacher,
      type: "select",
      options: (teachersRes.data ?? []).map((t) => ({ value: t.id, label: t.full_name })),
    },
    ...(view === "all"
      ? ([
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "active", label: "Aktiv" },
              { value: "frozen", label: "Muzlatilgan" },
              { value: "archived", label: "Arxiv" },
            ],
          },
        ] satisfies InlineField[])
      : []),
    {
      name: "gender",
      label: "Jinsi",
      type: "select",
      options: [
        { value: "erkak", label: "Erkak" },
        { value: "ayol", label: "Ayol" },
      ],
    },
    { name: "birth", label: "Tug'ilgan kun", type: "date", width: "w-40" },
  ];

  const showArchive = view === "archived";
  const showStatus = view === "all";
  const showPayment = view === "active" || view === "all";
  const columnCount = 7 + (showArchive ? 1 : 0) + (showStatus ? 1 : 0) + (showPayment ? 1 : 0);

  return (
    <div className="space-y-3">
      <InlineFilters
        storageKey={`students-${view}`}
        fields={fields}
        actions={canManage ? <NewStudentButton /> : undefined}
      />

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-ink-muted">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              Qarzdor: <b className="text-red-600">{formatSom(debt)}</b>
            </span>
            <span>
              Haqdor: <b className="text-green-600">{formatSom(credit)}</b>
            </span>
          </div>
          <span className="rounded-lg border border-line px-2.5 py-1">
            Umumiy soni <b className="ml-1 text-ink">{rows.length}</b>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas">
              <tr>
                <th className={`${TH} w-12`}>№</th>
                <th className={TH}>ID</th>
                <th className={TH}>{terms.student} ismi</th>
                <th className={TH}>Telefon raqam</th>
                <th className={TH}>Balans</th>
                <th className={TH}>{showArchive ? `Arxivlangan ${terms.group.toLowerCase()}` : terms.group}</th>
                <th className={TH}>{terms.teacher}</th>
                {showPayment && <th className={TH}>To&apos;lov sanasi</th>}
                {showStatus && <th className={TH}>Holati</th>}
                {showArchive && <th className={TH}>Arxivlangan sana</th>}
                <th className={TH}>Yaratilgan sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={columnCount + 1} className="px-4 py-16 text-center">
                    <Inbox size={22} className="mx-auto mb-2 text-ink-faint" aria-hidden="true" />
                    <div className="text-sm font-medium text-ink-muted">Ma&apos;lumotlar topilmadi</div>
                    <div className="mt-0.5 text-xs text-ink-faint">
                      Ma&apos;lumotlar topilmadi. Filterni o&apos;zgartirib ko&apos;ring.
                    </div>
                  </td>
                </tr>
              ) : (
                visible.map((s, i) => (
                  <tr key={s.id} className="hover:bg-canvas">
                    <td className="px-4 py-3 text-ink-faint">{offset + i + 1}</td>
                    <td className="px-4 py-3 text-ink-muted">{s.seq}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/education/students/${s.id}`}
                        className="font-medium text-ink hover:text-brand-600"
                      >
                        {s.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{s.phone || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <BalanceBadge balance={Number(s.balance)} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{s.group?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">{s.group?.teacher?.full_name ?? "—"}</td>
                    {showPayment && (
                      <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                        {lastPayment.get(s.id) ? formatDate(lastPayment.get(s.id)!) : "—"}
                      </td>
                    )}
                    {showStatus && (
                      <td className="px-4 py-3">
                        <StudentStatusBadge status={s.status} />
                      </td>
                    )}
                    {showArchive && (
                      <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                        {s.archived_at ? formatDate(s.archived_at) : "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                      {formatDate(s.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePager total={rows.length} page={current} size={size} />
      </div>
    </div>
  );
}
