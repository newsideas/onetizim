import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { GroupInfoCard } from "@/components/groups/GroupInfoCard";
import { EditGroupButton } from "@/components/groups/EditGroupButton";
import { GroupAttendanceGrid, type GridLesson, type GridMark, type GridStudent } from "@/components/groups/GroupAttendanceGrid";
import { GROUP_SELECT, type GroupRow } from "@/components/groups/GroupsTable";
import { StudentsTable, type StudentTableRow } from "@/components/students/StudentsTable";
import { termsFor, type Segment } from "@/lib/segment";
import { HAFTA_KUNLARI, MONTH_NAMES, formatDate, monthStartIso, nextMonth, parseMonth, todayIso } from "@/lib/utils/date";
import type { AttendanceStatus } from "@/types/database";

type Tab = "students" | "homework" | "attendance";

function shiftMonth(periodStart: string, delta: number): string {
  const [y, m] = periodStart.split("-").map(Number);
  return monthStartIso(new Date(y, m - 1 + delta, 1));
}

/** Oydagi dars kunlari: guruh jadvalidagi hafta kunlari, guruh muddati doirasida. */
function lessonDatesOf(periodStart: string, days: string[], from: string | null, to: string | null): GridLesson[] {
  const [y, m] = periodStart.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const out: GridLesson[] = [];
  for (let d = 1; d <= last; d++) {
    const iso = `${periodStart.slice(0, 7)}-${String(d).padStart(2, "0")}`;
    if (from && iso < from) continue;
    if (to && iso > to) continue;
    const weekday = HAFTA_KUNLARI[(new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7];
    if (days.includes(weekday)) out.push({ iso, label: `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}` });
  }
  return out;
}

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { groupId } = await params;
  const query = await searchParams;
  const { supabase, org, permissions } = await requirePermission("groups.view");

  const canHomework = permissions.includes("homework.manage");
  const canAttendance = permissions.includes("attendance.mark");
  const requested = query.tab;
  const tab: Tab =
    requested === "attendance" && canAttendance
      ? "attendance"
      : requested === "homework" && canHomework
        ? "homework"
        : "students";

  const [{ data: groupData }, { data: students }] = await Promise.all([
    supabase.from("groups").select(GROUP_SELECT).eq("id", groupId).maybeSingle(),
    supabase
      .from("students")
      .select("*, group:groups(name)")
      .eq("group_id", groupId)
      .neq("status", "archived")
      .order("full_name"),
  ]);

  if (!groupData) notFound();

  // Supabase inferi to-one join'ni massiv deb hisoblaydi (0008 izohiga qarang).
  const group = groupData as unknown as GroupRow;
  const studentRows = (students ?? []) as unknown as StudentTableRow[];
  const segment: Segment = org.type;
  const terms = termsFor(segment);
  const showBalance = permissions.includes("payments.manage");

  const tabHref = (t: Tab) => (t === "students" ? `/education/groups/${groupId}` : `/education/groups/${groupId}?tab=${t}`);

  // ---- Topshiriqlar (uy vazifalari)
  let homework: { id: string; subject: string; title: string; due_on: string; max_score: number | null }[] = [];
  if (tab === "homework") {
    const { data } = await supabase
      .from("homework")
      .select("id, subject, title, due_on, max_score")
      .eq("group_id", groupId)
      .order("due_on", { ascending: false })
      .limit(200);
    homework = data ?? [];
  }

  // ---- Davomat (oylik jadval)
  const period = parseMonth(query.month);
  let lessons: GridLesson[] = [];
  let gridStudents: GridStudent[] = [];
  const marks: Record<string, GridMark> = {};
  if (tab === "attendance") {
    lessons = lessonDatesOf(period, group.schedule_days ?? [], group.start_date ?? null, group.end_date ?? null);
    const active = studentRows.filter((s) => s.status === "active");
    const rangeEnd = nextMonth(period);
    const [attRes, gradeRes] = await Promise.all([
      supabase
        .from("attendance")
        .select("student_id, lesson_date, status, reason")
        .eq("group_id", groupId)
        .gte("lesson_date", period)
        .lt("lesson_date", rangeEnd),
      supabase
        .from("grades")
        .select("student_id, score")
        .eq("group_id", groupId)
        .gte("graded_on", period)
        .lt("graded_on", rangeEnd),
    ]);
    for (const a of attRes.data ?? []) {
      marks[`${a.student_id}|${a.lesson_date}`] = { status: a.status as AttendanceStatus, reason: a.reason ?? null };
    }
    const scores = new Map<string, number[]>();
    for (const g of gradeRes.data ?? []) scores.set(g.student_id, [...(scores.get(g.student_id) ?? []), Number(g.score)]);
    gridStudents = active.map((s) => {
      const list = scores.get(s.id);
      return {
        id: s.id,
        name: s.full_name,
        phone: s.phone ?? null,
        balance: Number(s.balance ?? 0),
        avgGrade: list && list.length ? list.reduce((a, b) => a + b, 0) / list.length : null,
      };
    });
  }
  const [py, pm] = period.split("-").map(Number);

  const TAB_CLASS = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? "bg-brand-600 text-white" : "text-ink-muted hover:bg-canvas hover:text-ink"
    }`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/education/groups"
            className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-canvas hover:text-ink"
            aria-label={`${terms.groupPlural}ga qaytish`}
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-semibold text-ink">{group.name}</h1>
        </div>
        {permissions.includes("groups.manage") && (
          <EditGroupButton
            groupId={groupId}
            defaultValues={{
              name: group.name,
              subject: group.course?.name ?? undefined,
              teacherName: group.teacher?.full_name ?? undefined,
              room: group.room?.name ?? undefined,
              scheduleDays: group.schedule_days ?? [],
              startTime: group.start_time ?? undefined,
              endTime: group.end_time ?? undefined,
              monthlyPrice: Number(group.monthly_price),
              educationType: group.education_type ?? "offline",
              status: group.status ?? "active",
              level: group.level ?? undefined,
              telegramUrl: group.telegram_url ?? undefined,
              startDate: group.start_date ?? undefined,
              endDate: group.end_date ?? undefined,
              lessonDurationMinutes: group.lesson_duration_minutes ?? undefined,
            }}
          />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div>
          <GroupInfoCard group={group} studentCount={studentRows.length} segment={segment} showFinance={showBalance} />
        </div>

        <div className="min-w-0 space-y-3">
          <nav aria-label="Guruh bo'limlari" className="flex flex-wrap items-center gap-1">
            <Link href={tabHref("students")} className={TAB_CLASS(tab === "students")}>
              {terms.studentPlural}
            </Link>
            {canHomework && (
              <Link href={tabHref("homework")} className={TAB_CLASS(tab === "homework")}>
                Topshiriqlar
              </Link>
            )}
            {canAttendance && (
              <Link href={tabHref("attendance")} className={TAB_CLASS(tab === "attendance")}>
                Davomat
              </Link>
            )}
          </nav>

          {tab === "students" && (
            <StudentsTable
              students={studentRows}
              emptyText={`Bu ${terms.group.toLowerCase()}da hali ${terms.student.toLowerCase()} yo'q.`}
              groupLabel={terms.group}
              linkToProfile={permissions.includes("students.view")}
              showBalance={showBalance}
            />
          )}

          {tab === "homework" && (
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead className="bg-canvas text-xs tracking-wide text-ink-muted uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Mavzu</th>
                    <th className="px-4 py-3 text-left font-semibold">Fan</th>
                    <th className="px-4 py-3 text-left font-semibold">Muddat</th>
                    <th className="px-4 py-3 text-right font-semibold">Maks. ball</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {homework.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-ink-muted">
                        Bu guruhga hali topshiriq berilmagan.{" "}
                        <Link href="/education/homework" className="text-brand-600 hover:underline">
                          Uy vazifalari
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    homework.map((h) => (
                      <tr key={h.id}>
                        <td className="px-4 py-3 font-medium text-ink">{h.title}</td>
                        <td className="px-4 py-3 text-ink-muted">{h.subject}</td>
                        <td className="px-4 py-3 text-ink-muted">{formatDate(h.due_on)}</td>
                        <td className="px-4 py-3 text-right text-ink-muted">{h.max_score ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === "attendance" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Link
                  href={`${tabHref("attendance")}&month=${shiftMonth(period, -1).slice(0, 7)}`}
                  className="rounded-lg border border-line p-1.5 text-ink-muted hover:bg-canvas"
                  aria-label="Oldingi oy"
                >
                  <ChevronLeft size={16} />
                </Link>
                <span className="min-w-32 text-center text-sm font-medium text-ink">
                  {MONTH_NAMES[pm - 1]} {py}
                </span>
                <Link
                  href={`${tabHref("attendance")}&month=${shiftMonth(period, 1).slice(0, 7)}`}
                  className="rounded-lg border border-line p-1.5 text-ink-muted hover:bg-canvas"
                  aria-label="Keyingi oy"
                >
                  <ChevronRight size={16} />
                </Link>
                <span className="ml-auto text-xs text-ink-faint">Faol {terms.studentPlural.toLowerCase()}: {gridStudents.length}</span>
              </div>
              <GroupAttendanceGrid
                key={period}
                groupId={groupId}
                students={gridStudents}
                lessons={lessons}
                initialMarks={marks}
                today={todayIso()}
                canMark={canAttendance}
                showBalance={showBalance}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
