import { HAFTA_KUNLARI, formatTime } from "@/lib/utils/date";
import type { ScheduleEntry } from "@/components/schedule/schedule-entries";
import { LessonDeleteButton } from "@/components/schedule/LessonDeleteButton";

/** Vaqti belgilanmagan darslar uchun alohida qator kaliti. */
const NO_TIME = "__no_time__";

export function ScheduleGrid({
  entries,
  canManage,
}: {
  entries: ScheduleEntry[];
  canManage: boolean;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
        Hali darslar yo&apos;q.{" "}
        {canManage
          ? "«Dars qo'shish» tugmasi orqali sinf, fan, kun va vaqtni kiriting."
          : "Dars jadvali direktor yoki administrator tomonidan kiritiladi."}
      </div>
    );
  }

  // Qatorlar: darslarda uchraydigan boshlanish vaqtlari (tartiblangan),
  // vaqti kiritilmaganlar esa eng oxirgi qatorda.
  const times = [...new Set(entries.map((e) => e.startTime?.slice(0, 5)).filter(Boolean))]
    .sort()
    .map((t) => t as string);

  const hasUntimed = entries.some((e) => !e.startTime);
  const rows: string[] = hasUntimed ? [...times, NO_TIME] : times;

  function entriesAt(time: string, day: string) {
    return entries.filter((e) => {
      const matchesTime =
        time === NO_TIME ? !e.startTime : e.startTime?.slice(0, 5) === time;
      return matchesTime && e.day === day;
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-canvas text-ink-muted">
          <tr>
            <th className="w-24 px-3 py-3 font-medium">Vaqt</th>
            {HAFTA_KUNLARI.map((day) => (
              <th key={day} className="min-w-[150px] px-3 py-3 font-medium">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((time) => (
            <tr key={time} className="align-top">
              <td className="px-3 py-3 whitespace-nowrap text-ink-faint">
                {time === NO_TIME ? "Vaqtsiz" : formatTime(time)}
              </td>
              {HAFTA_KUNLARI.map((day) => (
                <td key={day} className="px-3 py-3">
                  <div className="flex flex-col gap-2">
                    {entriesAt(time, day).map((e) => (
                      <div
                        key={e.key}
                        className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium whitespace-nowrap text-ink">{e.title}</div>
                          {canManage && e.lessonId && (
                            <LessonDeleteButton lessonId={e.lessonId} title={e.title} />
                          )}
                        </div>
                        {e.startTime && e.endTime && (
                          <div className="text-xs text-ink-faint">
                            {formatTime(e.startTime)}–{formatTime(e.endTime)}
                          </div>
                        )}
                        <div className="text-xs text-ink-faint">
                          {[e.subtitle, e.teacher, e.roomName].filter(Boolean).join(" · ") || "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
