import { timeToMinutes, minutesToTime, formatTime } from "@/lib/utils/date";
import type { ScheduleGroup } from "@/components/schedule/ScheduleGrid";

/** Bitta qator = 30 daqiqa (Edu tizimdagi kabi). */
const SLOT_MINUTES = 30;
const DEFAULT_START = 8 * 60; // 08:00
const DEFAULT_END = 20 * 60; // 20:00
const SLOT_HEIGHT = 40; // px

/** Xonasi ko'rsatilmagan guruhlar uchun virtual ustun. */
const NO_ROOM = "__no_room__";

interface RoomColumn {
  key: string;
  name: string;
}

/**
 * Darsning tugash vaqti: end_time bo'lmasa, davomiylikdan (yoki 60 daqiqa)
 * hisoblanadi — aks holda blokni chizib bo'lmaydi.
 */
function lessonEndMinutes(group: ScheduleGroup): number {
  const start = timeToMinutes(group.start_time!);
  if (group.end_time) return timeToMinutes(group.end_time);
  return start + (group.lesson_duration_minutes ?? 60);
}

export function DayScheduleGrid({
  groups,
  day,
}: {
  groups: ScheduleGroup[];
  day: string;
}) {
  const dayGroups = groups.filter((g) => g.schedule_days?.includes(day));
  const timed = dayGroups.filter((g) => g.start_time);
  const untimed = dayGroups.filter((g) => !g.start_time);

  if (dayGroups.length === 0) {
    return (
      <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
        {day} kuni dars yo&apos;q.
      </div>
    );
  }

  // Ustunlar: shu kuni band bo'lgan xonalar (+ xonasizlar uchun ustun)
  const roomMap = new Map<string, string>();
  for (const g of dayGroups) {
    const key = g.room?.id ?? NO_ROOM;
    if (!roomMap.has(key)) roomMap.set(key, g.room?.name ?? "Xona ko'rsatilmagan");
  }
  const rooms: RoomColumn[] = [...roomMap.entries()].map(([key, name]) => ({
    key,
    name,
  }));

  // Vaqt chegaralari: eng erta darsdan eng kech darsgacha (kamida 08:00–20:00)
  const starts = timed.map((g) => timeToMinutes(g.start_time!));
  const ends = timed.map(lessonEndMinutes);
  const rangeStart = Math.min(DEFAULT_START, ...starts);
  const rangeEnd = Math.max(DEFAULT_END, ...ends);

  const slotCount = Math.ceil((rangeEnd - rangeStart) / SLOT_MINUTES);
  const slots = Array.from(
    { length: slotCount },
    (_, i) => rangeStart + i * SLOT_MINUTES,
  );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-line">
        <div
          className="grid min-w-max"
          style={{
            gridTemplateColumns: `72px repeat(${rooms.length}, minmax(170px, 1fr))`,
            gridTemplateRows: `36px repeat(${slotCount}, ${SLOT_HEIGHT}px)`,
          }}
        >
          {/* Sarlavha: bo'sh burchak + xona nomlari */}
          <div className="sticky left-0 z-20 border-r border-b border-line bg-surface" />
          {rooms.map((room, i) => (
            <div
              key={room.key}
              className="border-b border-line bg-surface px-3 py-2 text-sm font-medium text-ink"
              style={{ gridColumn: i + 2, gridRow: 1 }}
            >
              {room.name}
            </div>
          ))}

          {/* Vaqt ustuni */}
          {slots.map((minutes, i) => (
            <div
              key={`t-${minutes}`}
              className="sticky left-0 z-20 border-r border-b border-line/70 bg-canvas px-2 py-1 text-xs text-ink-faint"
              style={{ gridColumn: 1, gridRow: i + 2 }}
            >
              {minutes % 60 === 0 ? minutesToTime(minutes) : ""}
            </div>
          ))}

          {/* Bo'sh kataklar — jadval to'rini chizadi */}
          {slots.map((minutes, i) =>
            rooms.map((room, j) => (
              <div
                key={`c-${room.key}-${minutes}`}
                className={`border-b border-line/70 ${
                  minutes % 60 === 0 ? "border-t border-t-line" : ""
                }`}
                style={{ gridColumn: j + 2, gridRow: i + 2 }}
              />
            )),
          )}

          {/* Dars bloklari — bir necha qatorga cho'ziladi */}
          {timed.map((g) => {
            const roomKey = g.room?.id ?? NO_ROOM;
            const colIndex = rooms.findIndex((r) => r.key === roomKey);
            if (colIndex === -1) return null;

            const start = timeToMinutes(g.start_time!);
            const end = lessonEndMinutes(g);
            const startRow = Math.floor((start - rangeStart) / SLOT_MINUTES) + 2;
            const endRow = Math.max(
              startRow + 1,
              Math.ceil((end - rangeStart) / SLOT_MINUTES) + 2,
            );

            return (
              <div
                key={g.id}
                className="z-10 m-0.5 overflow-hidden rounded-lg border border-brand-200 bg-brand-50 px-2 py-1.5"
                style={{
                  gridColumn: colIndex + 2,
                  gridRow: `${startRow} / ${endRow}`,
                }}
              >
                <div className="text-xs font-medium text-ink">{g.name}</div>
                <div className="text-[11px] text-ink-muted">
                  {formatTime(g.start_time)}
                  {g.end_time ? `–${formatTime(g.end_time)}` : ""}
                </div>
                {g.teacher?.full_name && (
                  <div className="truncate text-[11px] text-ink-faint">
                    {g.teacher.full_name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {untimed.length > 0 && (
        <div className="rounded-xl border border-line p-4">
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Vaqti belgilanmagan
          </h2>
          <div className="flex flex-wrap gap-2">
            {untimed.map((g) => (
              <span
                key={g.id}
                className="rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs text-ink-muted"
              >
                {g.name}
                {g.room?.name ? ` · ${g.room.name}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
