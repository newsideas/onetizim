import Link from "next/link";
import { ArrowRight, BookOpen, CalendarCheck, ClipboardList, GraduationCap, Users } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { Card, CardHeader } from "@/components/ui/Card";
import { getCabinetData, isUuid } from "@/lib/teacher-cabinet";
import { HAFTA_KUNLARI, bugungiKun, formatDate, formatTime, todayIso } from "@/lib/utils/date";

const ACTION_CLASS =
  "inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink";

export default async function CabinetPage({
  searchParams,
}: {
  searchParams: Promise<{ teacher?: string }>;
}) {
  const params = await searchParams;
  const { supabase, permissions, employeeId } = await requirePermission("dashboard.view");

  // Direktor/administrator istalgan o'qituvchining kabinetini ko'ra oladi.
  const canPreview = permissions.includes("staff.manage");
  const teacherId = canPreview && isUuid(params.teacher) ? params.teacher : employeeId;

  if (!teacherId) {
    let teachers: { id: string; full_name: string }[] = [];
    if (canPreview) {
      const { data } = await supabase.from("teachers").select("id, full_name").order("full_name");
      teachers = data ?? [];
    }
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-ink">O&apos;qituvchi kabineti</h1>
        {canPreview ? (
          <Card>
            <CardHeader title="O'qituvchini tanlang" />
            <ul className="divide-y divide-line p-2">
              {teachers.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/cabinet?teacher=${t.id}`}
                    className="flex items-center justify-between rounded-lg px-2 py-3 text-sm text-ink hover:bg-canvas"
                  >
                    {t.full_name}
                    <ArrowRight size={14} className="text-ink-faint" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
            Hisobingiz xodim kartasiga bog&apos;lanmagan. Direktorga murojaat qiling.
          </div>
        )}
      </div>
    );
  }

  const data = await getCabinetData(supabase, teacherId);
  const today = todayIso();
  const previewing = canPreview && teacherId !== employeeId;

  return (
    <div className="space-y-6">
      <div>
        {previewing && (
          <Link href="/cabinet" className="text-xs text-brand-600 hover:underline">
            ← O&apos;qituvchilar ro&apos;yxati
          </Link>
        )}
        <h1 className="text-xl font-semibold text-ink">
          {previewing ? data.teacher?.full_name : `Salom, ${data.teacher?.full_name ?? "ustoz"}`}
        </h1>
        <p className="text-sm text-ink-muted">
          {formatDate(new Date())} · {bugungiKun()}
          {previewing && " · o'qituvchi kabineti ko'rinishi"}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wide text-ink-muted uppercase">Bugungi darslar</h2>
        {data.todayLessons.length === 0 ? (
          <div className="rounded-xl border border-line p-6 text-center text-sm text-ink-faint">
            Bugun dars yo&apos;q.
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.todayLessons.map((l) => (
              <li key={l.key} className="space-y-3 rounded-xl border border-line bg-surface p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink">{l.subject}</div>
                    <div className="text-sm text-ink-muted">
                      {l.groupName}
                      {l.roomName ? ` · ${l.roomName}` : ""}
                    </div>
                  </div>
                  {l.startTime && (
                    <div className="shrink-0 text-right text-sm font-medium text-ink">
                      {formatTime(l.startTime)}
                      {l.endTime ? `–${formatTime(l.endTime)}` : ""}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/education/attendance?group=${l.groupId}&date=${today}`}
                    className={ACTION_CLASS}
                  >
                    <CalendarCheck size={13} aria-hidden="true" />
                    Davomat
                  </Link>
                  <Link
                    href={`/education/grades?group=${l.groupId}&subject=${encodeURIComponent(l.subject)}`}
                    className={ACTION_CLASS}
                  >
                    <GraduationCap size={13} aria-hidden="true" />
                    Baholar
                  </Link>
                  <Link href={`/education/homework?group=${l.groupId}`} className={ACTION_CLASS}>
                    <ClipboardList size={13} aria-hidden="true" />
                    Vazifa
                  </Link>
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[11px] ${
                      l.attendanceMarked
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200"
                    }`}
                  >
                    {l.attendanceMarked ? "Davomat belgilangan" : "Davomat belgilanmagan"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Sinflarim" />
          <div className="p-2">
            {data.groups.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-ink-faint">Sinf biriktirilmagan.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.groups.map((g) => (
                  <li key={g.id} className="flex items-center gap-3 px-2 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">{g.name}</div>
                      <div className="flex items-center gap-1 text-xs text-ink-faint">
                        <Users size={12} aria-hidden="true" />
                        {g.studentCount} ta o&apos;quvchi
                      </div>
                    </div>
                    <Link href={`/education/groups/${g.id}`} className={ACTION_CLASS}>
                      <BookOpen size={13} aria-hidden="true" />
                      O&apos;quvchilar
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Yaqin uy vazifalari"
            action={
              <Link href="/education/homework" className="text-xs font-medium text-brand-600 hover:underline">
                Barchasi
              </Link>
            }
          />
          <div className="p-2">
            {data.homework.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-ink-faint">Hozircha vazifa yo&apos;q.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.homework.map((h) => (
                  <li key={h.id} className="px-2 py-3">
                    <div className="text-sm font-medium text-ink">{h.title}</div>
                    <div className="text-xs text-ink-faint">
                      {h.groupName} · {h.subject} · topshirish {formatDate(h.dueOn)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader title="Haftalik jadvalim" />
        <div className="p-4">
          {data.weekLessons.length === 0 ? (
            <p className="text-center text-sm text-ink-faint">Dars jadvali kiritilmagan.</p>
          ) : (
            <div className="space-y-3">
              {HAFTA_KUNLARI.map((day, i) => {
                const items = data.weekLessons.filter((l) => l.weekday === i + 1);
                if (items.length === 0) return null;
                return (
                  <div key={day} className="flex gap-4">
                    <div className="w-28 shrink-0 text-sm font-medium text-ink-muted">{day}</div>
                    <ul className="flex-1 space-y-1 text-sm text-ink">
                      {items.map((l) => (
                        <li key={l.key}>
                          <span className="text-ink-faint">
                            {l.startTime ? formatTime(l.startTime) : "—"}
                          </span>{" "}
                          {l.subject} · {l.groupName}
                          {l.roomName ? ` · ${l.roomName}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
