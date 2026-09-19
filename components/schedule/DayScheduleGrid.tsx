import { timeToMinutes, minutesToTime, formatTime } from "@/lib/utils/date";
import type { ScheduleEntry } from "@/components/schedule/schedule-entries";
import { LessonActions } from "@/components/schedule/LessonActions";
import type { LessonOptions } from "@/components/schedule/LessonFormModal";

/** Bitta qator = 30 daqiqa (Edu tizimdagi kabi). */
const SLOT_MINUTES = 30;
const DEFAULT_START = 8 * 60; // 08:00
const DEFAULT_END = 20 * 60; // 20:00
const SLOT_HEIGHT = 40; // px

/** Xonasi ko'rsatilmagan darslar uchun virtual ustun. */
const NO_ROOM = "__no_room__";

interface RoomColumn {
  key: string;
  name: string;
}

/**
 * Darsning tugash vaqti: endTime bo'lmasa, davomiylikdan (yoki 60 daqiqa)
 * hisoblanadi — aks holda blokni chizib bo'lmaydi.
 */
function entryEndMinutes(entry: ScheduleEntry): number {
  const start = timeToMinutes(entry.startTime!);
  if (entry.endTime) return timeToMinutes(entry.endTime);
  return start + (entry.durationMinutes ?? 60);
}

export function DayScheduleGrid({
  entries,
  day,
  options,
}: {
  entries: ScheduleEntry[];
  day: string;
  options: LessonOptions | null;
}) {
  const dayEntries = entries.filter((e) => e.day === day);
  const timed = dayEntries.filter((e) => e.startTime);
  const untimed = dayEntries.filter((e) => !e.startTime);

  if (dayEntries.length === 0) {
    return (
      <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
        {day} kuni dars yo&apos;q.
      </div>
    );
  }

  // Ustunlar: shu kuni band bo'lgan xonalar (+ xonasizlar uchun ustun)
  const roomMap = new Map<string, string>();
  for (const e of dayEntries) {
    const key = e.roomId ?? NO_ROOM;
    if (!roomMap.has(key)) roomMap.set(key, e.roomName ?? "Xona ko'rsatilmagan");
  }
  const rooms: RoomColumn[] = [...roomMap.entries()].map(([key, name]) => ({
    key,
    name,
  }));

  // Vaqt chegaralari: eng erta darsdan eng kech darsgacha (kamida 08:00–20:00)
  const starts = timed.map((e) => timeToMinutes(e.startTime!));
  const ends = timed.map(entryEndMinutes);
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
          {timed.map((e) => {
            const roomKey = e.roomId ?? NO_ROOM;
            const colIndex = rooms.findIndex((r) => r.key === roomKey);
            if (colIndex === -1) return null;

            const start = timeToMinutes(e.startTime!);
            const end = entryEndMinutes(e);
            const startRow = Math.floor((start - rangeStart) / SLOT_MINUTES) + 2;
            const endRow = Math.max(
              startRow + 1,
              Math.ceil((end - rangeStart) / SLOT_MINUTES) + 2,
            );

            return (
              <div
                key={e.key}
                className="z-10 m-0.5 overflow-hidden rounded-lg border border-brand-200 bg-brand-50 px-2 py-1.5"
                style={{
                  gridColumn: colIndex + 2,
                  gridRow: `${startRow} / ${endRow}`,
                }}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="text-xs font-medium text-ink">{e.title}</div>
                  {options && e.lesson && (
                    <LessonActions lesson={e.lesson} title={e.title} options={options} />
                  )}
                </div>
                <div className="text-[11px] text-ink-muted">
                  {formatTime(e.startTime)}
                  {e.endTime ? `–${formatTime(e.endTime)}` : ""}
                </div>
                {(e.subtitle || e.teacher) && (
                  <div className="truncate text-[11px] text-ink-faint">
                    {[e.subtitle, e.teacher].filter(Boolean).join(" · ")}
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
            {untimed.map((e) => (
              <span
                key={e.key}
                className="rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs text-ink-muted"
              >
                {e.title}
                {e.roomName ? ` · ${e.roomName}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
