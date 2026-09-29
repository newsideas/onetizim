import Link from "next/link";
import { Eye } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getAttendanceForGroup } from "@/lib/actions/attendance";
import { getLessonAttendance } from "@/lib/actions/lesson-attendance";
import { AttendanceFilters } from "@/components/attendance/AttendanceFilters";
import { AttendanceTable } from "@/components/attendance/AttendanceTable";
import { BalanceBadge } from "@/components/payments/BalanceBadge";
import { InlineFilters, type InlineField } from "@/components/ui/ListToolbar";
import { ReportTable } from "@/components/reports/ReportParts";
import { ABSENCE_REASONS, ATTENDANCE_STATUS_LABELS } from "@/lib/attendance-reasons";
import { formatDate, formatTime, todayIso } from "@/lib/utils/date";

type SearchParams = Record<string, string | undefined>;

interface AttendanceRow {
  id: string;
  lesson_date: string;
  status: "present" | "late" | "absent";
  reason?: string | null;
  marked_by: string | null;
  student: { id: string; full_name: string; phone: string | null; balance: number | null; status: string } | null;
  group: { id: string; name: string; teacher: { full_name: string } | null } | null;
  /** Faqat maktab (fan bo'yicha davomat). */
  lesson?: { subject: string; start_time: string; teacher: { full_name: string } | null } | null;
}

const WEEKDAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];
const STATUS_BADGE: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  late: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  absent: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
};

/** 0 = dushanba ... 6 = yakshanba */
const weekdayOf = (iso: string) => (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;

/**
 * Davomat: standart holatda Edu tizimdagidek "O'quvchilarni davomatini ko'rish" oynasi (filtrlar, sabab,
 * moderator, eng ko'p dars qoldirganlar). "Davomat belgilash" (yoki `?group=` bilan kelgan havola) — belgilash rejimi.
 */
export default async function AttendancePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const { supabase, permissions, org, employeeId } = await requirePermission("attendance.mark");
  const isSchool = org.type === "maktab";
  const anyDate = permissions.includes("attendance.any_date");

  if (params.group || params.mark === "1") {
    if (isSchool) {
      return (
        <SchoolMarkMode
          params={params}
          supabase={supabase}
          anyDate={anyDate}
          // Boshqaruv huquqi bo'lmasa (o'qituvchi) — faqat o'z darslari va sinf rahbari bo'lgan sinflari.
          employeeId={permissions.includes("groups.manage") ? null : employeeId}
        />
      );
    }
    return <MarkMode params={params} supabase={supabase} anyDate={anyDate} />;
  }
  return <ViewMode params={params} supabase={supabase} isSchool={isSchool} />;
}

type Supa = Awaited<ReturnType<typeof requirePermission>>["supabase"];

/** 1 = Dushanba ... 7 = Yakshanba (lessons.weekday). */
const lessonWeekday = (iso: string) => weekdayOf(iso) + 1;

interface SchoolLesson {
  id: string;
  group_id: string;
  subject: string;
  weekday: number;
  start_time: string;
  end_time: string;
  teacher_id: string | null;
  teacher: { full_name: string } | null;
}

/**
 * Maktab: fan bo'yicha davomat. Sinf va sana tanlanadi, shu kundagi darslar (1-soat, 2-soat…)
 * ro'yxatidan bittasi olinib, o'quvchilar shu dars uchun belgilanadi.
 */
async function SchoolMarkMode({
  params,
  supabase,
  anyDate,
  employeeId,
}: {
  params: SearchParams;
  supabase: Supa;
  anyDate: boolean;
  /** null — boshqaruv (hamma sinf va darslar). */
  employeeId: string | null;
}) {
  const [groupsRes, lessonsRes] = await Promise.all([
    supabase.from("groups").select("id, name, teacher_id").eq("status", "active").order("name"),
    supabase
      .from("lessons")
      .select("id, group_id, subject, weekday, start_time, end_time, teacher_id, teacher:teachers(full_name)")
      .order("start_time"),
  ]);
  const allLessons = (lessonsRes.data ?? []) as unknown as SchoolLesson[];
  const allGroups = (groupsRes.data ?? []) as { id: string; name: string; teacher_id: string | null }[];

  // O'qituvchi: sinf rahbari bo'lgan sinfda barcha darslar, boshqa sinflarda faqat o'zi o'tadigan darslar.
  const leads = new Set(employeeId ? allGroups.filter((g) => g.teacher_id === employeeId).map((g) => g.id) : []);
  const lessons = employeeId
    ? allLessons.filter((l) => l.teacher_id === employeeId || leads.has(l.group_id))
    : allLessons;
  const visibleGroupIds = new Set(lessons.map((l) => l.group_id));
  const groups = allGroups
    .filter((g) => !employeeId || visibleGroupIds.has(g.id) || leads.has(g.id))
    .sort((a, b) => a.name.localeCompare(b.name, "uz", { numeric: true }));

  const back = (
    <Link href="/education/attendance" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:underline">
      <Eye size={15} aria-hidden="true" /> Davomatni ko&apos;rish
    </Link>
  );

  if (groups.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-ink">Davomat belgilash</h1>
        {back}
        <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
          {employeeId ? "Sizga biriktirilgan sinf yoki dars yo'q." : "Avval kamida bitta sinf oching."}
        </div>
      </div>
    );
  }

  const groupId = params.group && groups.some((g) => g.id === params.group) ? params.group : groups[0].id;
  const date = anyDate ? params.date || todayIso() : todayIso();
  const dayLessons = lessons
    .filter((l) => l.group_id === groupId && l.weekday === lessonWeekday(date))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  const lesson = dayLessons.find((l) => l.id === params.lesson) ?? dayLessons[0];
  const students = lesson ? await getLessonAttendance(lesson.id, date) : [];

  const hrefFor = (lessonId: string) => `/education/attendance?${new URLSearchParams({ group: groupId, date, lesson: lessonId })}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Davomat belgilash</h1>
          <p className="text-sm text-ink-faint">Fan bo&apos;yicha: har bir dars soati uchun alohida</p>
        </div>
        {back}
      </div>
      <AttendanceFilters groups={groups} groupId={groupId} date={date} dateLocked={!anyDate} groupLabel="Sinf" />

      {lessonsRes.error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">Dars jadvalini o&apos;qib bo&apos;lmadi.</p>
      )}

      {dayLessons.length === 0 ? (
        <div className="rounded-xl border border-line p-8 text-center text-sm text-ink-faint">
          {formatDate(date)} ({WEEKDAYS[weekdayOf(date)]}) kuni bu sinfda dars yo&apos;q.{" "}
          <Link href="/education/schedule" className="font-medium text-brand-600 hover:underline">
            Dars jadvali
          </Link>
        </div>
      ) : (
        <>
          <nav aria-label="Darslar" className="flex flex-wrap gap-2">
            {dayLessons.map((l, i) => {
              const active = l.id === lesson?.id;
              return (
                <Link
                  key={l.id}
                  href={hrefFor(l.id)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                    active
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-line bg-surface text-ink-muted hover:bg-canvas"
                  }`}
                >
                  <div className="font-semibold">
                    {i + 1}-dars · {l.subject}
                  </div>
                  <div className={active ? "text-white/80" : "text-ink-faint"}>
                    {formatTime(l.start_time)}–{formatTime(l.end_time)}
                    {l.teacher ? ` · ${l.teacher.full_name}` : ""}
                  </div>
                </Link>
              );
            })}
          </nav>
          {lesson && (
            <AttendanceTable
              key={`${lesson.id}-${date}`}
              initialStudents={students}
              groupId={groupId}
              date={date}
              lessonId={lesson.id}
            />
          )}
        </>
      )}
    </div>
  );
}

async function MarkMode({ params, supabase, anyDate }: { params: SearchParams; supabase: Supa; anyDate: boolean }) {
  const { data: groups } = await supabase.from("groups").select("id, name").order("name");

  const back = (
    <Link href="/education/attendance" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:underline">
      <Eye size={15} aria-hidden="true" /> Davomatni ko&apos;rish
    </Link>
  );

  if (!groups || groups.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-ink">Davomat belgilash</h1>
        {back}
        <div className="rounded-xl border border-line p-8 text-center text-ink-faint">Avval kamida bitta guruh yarating.</div>
      </div>
    );
  }

  const groupId = params.group && groups.some((g) => g.id === params.group) ? params.group : groups[0].id;
  // Ruxsati bo'lmasa (odatda o'qituvchi) faqat bugungi kunga belgilaydi.
  const date = anyDate ? params.date || todayIso() : todayIso();
  const students = await getAttendanceForGroup(groupId, date);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink">Davomat belgilash</h1>
        {back}
      </div>
      <AttendanceFilters groups={groups} groupId={groupId} date={date} dateLocked={!anyDate} />
      <AttendanceTable key={`${groupId}-${date}`} initialStudents={students} groupId={groupId} date={date} />
    </div>
  );
}

async function ViewMode({ params, supabase, isSchool }: { params: SearchParams; supabase: Supa; isSchool: boolean }) {
  const today = todayIso();
  // Oraliq berilsa shu oraliq ("dan" bo'lsa "gacha" bugungacha), bo'lmasa bitta sana (standart — bugun).
  const start = params.from || params.to || params.date || today;
  const end = params.to || (params.from ? (params.from > today ? params.from : today) : params.date || today);

  const buildQuery = (columns: string) => {
    let q = supabase
      .from(isSchool ? "lesson_attendance" : "attendance")
      .select(columns)
      .gte("lesson_date", start)
      .lte("lesson_date", end)
      .order("lesson_date", { ascending: false })
      .limit(3000);
    if (params.group) q = q.eq("group_id", params.group);
    if (params.came) q = q.eq("status", params.came);
    return q;
  };
  const rich =
    "id, lesson_date, status, reason, marked_by, student:students(id, full_name, phone, balance, status), group:groups(id, name, teacher:teachers(full_name))" +
    (isSchool ? ", lesson:lessons(subject, start_time, teacher:teachers(full_name))" : "");
  let res = await buildQuery(rich);
  // "reason" ustuni (0070) yo'q bo'lsa sababsiz so'rov.
  if (res.error && !isSchool) res = await buildQuery(rich.replace(" reason,", ""));

  const [groupsRes, membersRes] = await Promise.all([
    supabase.from("groups").select("id, name, teacher:teachers(full_name)").order("name"),
    supabase.from("org_members").select("user_id, full_name, login"),
  ]);
  const groups = ((groupsRes.data ?? []) as unknown as { id: string; name: string; teacher: { full_name: string } | null }[]).map((g) => ({
    id: g.id,
    name: g.name,
    teacher_name: g.teacher?.full_name ?? null,
  }));
  const members = (membersRes.data ?? []) as { user_id: string; full_name: string | null; login: string | null }[];
  const memberName = new Map(members.map((m) => [m.user_id, m.full_name || m.login || "—"]));

  // Maktabda o'qituvchi — darsni o'tgan fan o'qituvchisi, markazda — guruh o'qituvchisi.
  const teacherOf = (r: AttendanceRow) => (isSchool ? r.lesson?.teacher?.full_name : r.group?.teacher?.full_name) ?? null;
  const q = (params.q ?? "").trim().toLowerCase();
  const rows = ((res.data ?? []) as unknown as AttendanceRow[]).filter((r) => {
    if (!r.student) return false;
    if (params.day && weekdayOf(r.lesson_date) !== Number(params.day)) return false;
    if (params.moderator && r.marked_by !== params.moderator) return false;
    if (params.teacher && teacherOf(r) !== params.teacher) return false;
    if (params.reason && r.reason !== params.reason) return false;
    if (params.sstatus && r.student.status !== params.sstatus) return false;
    const balance = Number(r.student.balance ?? 0);
    if (params.color === "debt" && balance >= 0) return false;
    if (params.color === "positive" && balance <= 0) return false;
    if (params.color === "zero" && balance !== 0) return false;
    if (q && !`${r.student.full_name} ${r.student.phone ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const top = params.top === "1";
  const perStudent = new Map<string, { row: AttendanceRow; absent: number; late: number; present: number }>();
  if (top) {
    for (const r of rows) {
      const id = r.student!.id;
      const cur = perStudent.get(id) ?? { row: r, absent: 0, late: 0, present: 0 };
      cur[r.status] += 1;
      perStudent.set(id, cur);
    }
  }
  const topRows = [...perStudent.values()].filter((x) => x.absent > 0).sort((a, b) => b.absent - a.absent);

  const teacherNames = isSchool
    ? ((res.data ?? []) as unknown as AttendanceRow[]).map((r) => r.lesson?.teacher?.full_name)
    : groups.map((g) => g.teacher_name);
  const teachers = [...new Set(teacherNames.filter((t): t is string => Boolean(t)))].sort();
  const groupHeader = isSchool ? "Sinf" : "Guruh";
  const fields: InlineField[] = [
    { name: "top", label: "Eng ko'p dars qoldirganlar bo'yicha", type: "toggle", width: "w-72" },
    { name: "day", label: "Kun", type: "select", options: WEEKDAYS.map((label, i) => ({ value: String(i), label })) },
    {
      name: "came",
      label: "Keldi",
      type: "select",
      options: [
        { value: "present", label: ATTENDANCE_STATUS_LABELS.present },
        { value: "late", label: ATTENDANCE_STATUS_LABELS.late },
        { value: "absent", label: ATTENDANCE_STATUS_LABELS.absent },
      ],
    },
    {
      name: "color",
      label: "Ranglar bo'yicha",
      type: "select",
      options: [
        { value: "debt", label: "Qarzdor (qizil)" },
        { value: "positive", label: "Balansi bor" },
        { value: "zero", label: "Balans nol" },
      ],
    },
    {
      name: "moderator",
      label: "Moderator",
      type: "select",
      options: members.map((m) => ({ value: m.user_id, label: m.full_name || m.login || "—" })),
    },
    { name: "teacher", label: "O'qituvchi", type: "select", options: teachers.map((t) => ({ value: t, label: t })) },
    { name: "reason", label: "Sababi", type: "select", options: ABSENCE_REASONS.map((r) => ({ value: r, label: r })) },
    { name: "group", label: isSchool ? "Sinf" : "Guruh", type: "select", options: groups.map((g) => ({ value: g.id, label: g.name })) },
    {
      name: "sstatus",
      label: "O'quvchini guruhdagi holati",
      type: "select",
      width: "w-56",
      options: [
        { value: "active", label: "Aktiv" },
        { value: "frozen", label: "Muzlatilgan" },
        { value: "archived", label: "Arxiv" },
      ],
    },
    { name: "date", label: "Sana", type: "date", defaultValue: today, width: "w-40" },
    { name: "from", label: "Oraliq: dan", type: "date", width: "w-40" },
    { name: "to", label: "Oraliq: gacha", type: "date", width: "w-40" },
    { name: "q", label: "Qidirish", type: "text", width: "w-48" },
  ];

  const idOf = (id: string) => id.slice(0, 6).toUpperCase();

  return (
    <div className="space-y-4">
      <InlineFilters
        storageKey="attendance-view"
        fields={fields}
        actions={
          <Link
            href="/education/attendance?mark=1"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-brand-700"
          >
            <Eye size={15} aria-hidden="true" />
            Davomat belgilash
          </Link>
        }
      />

      {res.error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {isSchool && /lesson_attendance/.test(res.error.message)
            ? "Fan bo'yicha davomat jadvali bazada yo'q — 0075_lesson_attendance.sql migratsiyasini Supabase SQL Editor'da ishga tushiring."
            : `Davomatni o'qib bo'lmadi: ${res.error.message}`}
        </p>
      )}

      {top ? (
        <ReportTable
          rows={topRows}
          rowKey={(r) => r.row.student!.id}
          columns={[
            { header: "ID", cell: (r) => idOf(r.row.student!.id) },
            {
              header: "O'quvchini ismi",
              cell: (r) => (
                <Link href={`/education/students/${r.row.student!.id}`} className="font-medium text-ink hover:text-brand-600">
                  {r.row.student!.full_name}
                </Link>
              ),
            },
            { header: "Telefon raqam", cell: (r) => r.row.student!.phone ?? "—" },
            { header: "Balans", cell: (r) => <BalanceBadge balance={Number(r.row.student!.balance ?? 0)} /> },
            { header: groupHeader, cell: (r) => r.row.group?.name ?? "—" },
            { header: isSchool ? "Sinf rahbari" : "O'qituvchi", cell: (r) => r.row.group?.teacher?.full_name ?? "—" },
            { header: "Kelmagan darslar", cell: (r) => <span className="font-semibold text-red-600">{r.absent}</span> },
            { header: "Kechikkan", cell: (r) => r.late },
            { header: "Kelgan", cell: (r) => r.present },
          ]}
        />
      ) : (
        <ReportTable
          rows={rows}
          rowKey={(r) => r.id}
          columns={[
            { header: "ID", cell: (r) => idOf(r.student!.id) },
            {
              header: "O'quvchini ismi",
              cell: (r) => (
                <Link href={`/education/students/${r.student!.id}`} className="font-medium text-ink hover:text-brand-600">
                  {r.student!.full_name}
                </Link>
              ),
            },
            { header: "Telefon raqam", cell: (r) => r.student!.phone ?? "—" },
            { header: "Balans", cell: (r) => <BalanceBadge balance={Number(r.student!.balance ?? 0)} /> },
            { header: groupHeader, cell: (r) => r.group?.name ?? "—" },
            ...(isSchool
              ? [
                  {
                    header: "Fan",
                    cell: (r: AttendanceRow) =>
                      r.lesson ? `${formatTime(r.lesson.start_time)} · ${r.lesson.subject}` : "—",
                  },
                ]
              : []),
            { header: "O'qituvchi", cell: (r) => teacherOf(r) ?? "—" },
            { header: "Moderator", cell: (r) => (r.marked_by ? (memberName.get(r.marked_by) ?? "—") : "—") },
            {
              header: "Holati",
              cell: (r) => (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[r.status]}`}>
                  {ATTENDANCE_STATUS_LABELS[r.status]}
                </span>
              ),
            },
            { header: "Sababi", cell: (r) => r.reason ?? "—" },
            { header: "Sana", cell: (r) => formatDate(r.lesson_date) },
          ]}
        />
      )}
    </div>
  );
}
