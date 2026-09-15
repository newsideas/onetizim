import { HAFTA_KUNLARI, formatTime } from "@/lib/utils/date";

export interface ScheduleGroup {
  id: string;
  name: string;
  course: { name: string } | null;
  room: { id: string; name: string } | null;
  lesson_duration_minutes: number | null;
  schedule_days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  teacher: { full_name: string } | null;
}

/** Vaqti belgilanmagan guruhlar uchun alohida qator kaliti. */
const NO_TIME = "__no_time__";

export function ScheduleGrid({ groups }: { groups: ScheduleGroup[] }) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
        Hali guruhlar yo&apos;q. Guruhlar sahifasida qo&apos;shing — dars kunlari
        va vaqti kiritilgan guruhlar shu jadvalda ko&apos;rinadi.
      </div>
    );
  }

  // Qatorlar: guruhlarda uchraydigan boshlanish vaqtlari (tartiblangan),
  // vaqti kiritilmaganlar esa eng oxirgi qatorda.
  const times = [...new Set(groups.map((g) => g.start_time).filter(Boolean))]
    .sort()
    .map((t) => t as string);

  const hasUntimed = groups.some((g) => !g.start_time);
  const rows: string[] = hasUntimed ? [...times, NO_TIME] : times;

  function groupsAt(time: string, day: string) {
    return groups.filter((g) => {
      const matchesTime = time === NO_TIME ? !g.start_time : g.start_time === time;
      return matchesTime && g.schedule_days?.includes(day);
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
              {HAFTA_KUNLARI.map((day) => {
                const cellGroups = groupsAt(time, day);
                return (
                  <td key={day} className="px-3 py-3">
                    <div className="flex flex-col gap-2">
                      {cellGroups.map((g) => (
                        <div
                          key={g.id}
                          className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2"
                        >
                          <div className="font-medium whitespace-nowrap text-ink">{g.name}</div>
                          {g.start_time && g.end_time && (
                            <div className="text-xs text-ink-faint">
                              {formatTime(g.start_time)}–{formatTime(g.end_time)}
                            </div>
                          )}
                          <div className="text-xs text-ink-faint">
                            {[g.teacher?.full_name, g.room?.name]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
