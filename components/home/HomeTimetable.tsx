"use client";

import type { ReactNode } from "react";
import { formatTime, minutesToTime, timeToMinutes } from "@/lib/utils/date";
import type { ScheduleEntry } from "@/components/schedule/schedule-entries";

export type GroupBy = "room" | "teacher";
export type TimetableView = "grid" | "list";

/** Bitta qator = 30 daqiqa (Edu tizimdagi kabi). */
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 44; // px
const HEADER_HEIGHT = 40; // px
const TIME_COL_WIDTH = 112; // px
const DEFAULT_DURATION = 60;

/** Xonasi / o'qituvchisi ko'rsatilmagan darslar uchun virtual ustun. */
const NO_COLUMN = "__none__";

/** Guruhga qarab dars bloki rangi — bir guruh doim bir xil rangda. */
const BLOCK_COLORS = [
  "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200",
  "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  "border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300",
  "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
  "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
];

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return BLOCK_COLORS[hash % BLOCK_COLORS.length];
}

function endMinutes(e: ScheduleEntry): number {
  const start = timeToMinutes(e.startTime!);
  if (e.endTime) return timeToMinutes(e.endTime);
  return start + (e.durationMinutes ?? DEFAULT_DURATION);
}

export interface Column {
  key: string;
  name: string;
}

interface PlacedBlock {
  entry: ScheduleEntry;
  start: number;
  end: number;
  lane: number;
  lanes: number;
}

/**
 * Bir ustundagi vaqti kesishgan darslar yonma-yon (lane) chiziladi —
 * aks holda biri ikkinchisining ustini yopib qo'yardi.
 */
function placeBlocks(entries: ScheduleEntry[]): PlacedBlock[] {
  const sorted = entries
    .map((entry) => ({ entry, start: timeToMinutes(entry.startTime!), end: endMinutes(entry) }))
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const result: PlacedBlock[] = [];
  let cluster: PlacedBlock[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    for (const block of cluster) block.lanes = laneEnds.length;
    result.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  for (const item of sorted) {
    if (cluster.length > 0 && item.start >= clusterEnd) flush();

    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.end);
    } else {
      laneEnds[lane] = item.end;
    }
    cluster.push({ ...item, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  flush();
  return result;
}

export function HomeTimetable({
  entries,
  columns,
  groupBy,
  view,
  startHour,
  endHour,
  emptyText,
  renderActions,
}: {
  /** Tanlangan kunning (va filtrlardan o'tgan) darslari. */
  entries: ScheduleEntry[];
  /** Ustunlar: xonalar yoki o'qituvchilar. */
  columns: Column[];
  groupBy: GroupBy;
  view: TimetableView;
  startHour: number;
  endHour: number;
  emptyText: string;
  /** Dars bloki burchagidagi tugmalar (tahrirlash/o'chirish) — faqat boshqarish huquqi borlarga. */
  renderActions?: (entry: ScheduleEntry) => ReactNode;
}) {
  const timed = entries.filter((e) => e.startTime);
  const untimed = entries.filter((e) => !e.startTime);

  if (view === "list") {
    return <TimetableList timed={timed} untimed={untimed} emptyText={emptyText} />;
  }

  // Vaqt chegarasi: sozlamadagi soatlar, lekin undan tashqaridagi dars ham sig'sin.
  const rangeStart = Math.min(
    startHour * 60,
    ...timed.map((e) => Math.floor(timeToMinutes(e.startTime!) / SLOT_MINUTES) * SLOT_MINUTES),
  );
  const rangeEnd = Math.max(
    endHour * 60,
    ...timed.map((e) => Math.ceil(endMinutes(e) / SLOT_MINUTES) * SLOT_MINUTES),
  );
  const slotCount = Math.max(1, Math.ceil((rangeEnd - rangeStart) / SLOT_MINUTES));
  const bodyHeight = slotCount * SLOT_HEIGHT;

  const keyOf = (e: ScheduleEntry) =>
    (groupBy === "room" ? e.roomId : e.teacher) ?? NO_COLUMN;

  // Ma'lumotnomada yo'q, lekin dars biriktirilgan (yoki biriktirilmagan) ustunlar oxirida.
  const known = new Set(columns.map((c) => c.key));
  const extra: Column[] = [];
  for (const e of timed) {
    const key = keyOf(e);
    if (!known.has(key) && !extra.some((c) => c.key === key)) {
      extra.push({
        key,
        name:
          key === NO_COLUMN
            ? groupBy === "room"
              ? "Xona ko'rsatilmagan"
              : "O'qituvchi ko'rsatilmagan"
            : ((groupBy === "room" ? e.roomName : e.teacher) ?? key),
      });
    }
  }
  const allColumns = [...columns, ...extra];

  const slots = Array.from({ length: slotCount }, (_, i) => rangeStart + i * SLOT_MINUTES);
  const lineColor = "var(--color-line)";
  const gridLines = `repeating-linear-gradient(to bottom, transparent 0, transparent ${SLOT_HEIGHT - 1}px, ${lineColor} ${SLOT_HEIGHT - 1}px, ${lineColor} ${SLOT_HEIGHT}px)`;

  return (
    <div className="space-y-3">
      <div className="flex min-w-max">
        {/* Vaqt ustuni */}
        <div
          className="sticky left-0 z-20 flex-none border-r border-line bg-canvas"
          style={{ width: TIME_COL_WIDTH }}
        >
          <div
            className="sticky top-0 z-30 border-b border-line bg-canvas"
            style={{ height: HEADER_HEIGHT }}
          />
          {slots.map((minutes) => (
            <div
              key={minutes}
              className="flex items-start justify-center border-b border-line px-1 pt-1.5 text-xs whitespace-nowrap text-ink-muted"
              style={{ height: SLOT_HEIGHT }}
            >
              {minutesToTime(minutes)} - {minutesToTime(minutes + SLOT_MINUTES)}
            </div>
          ))}
        </div>

        {/* Xona / o'qituvchi ustunlari */}
        {allColumns.length === 0 ? (
          <div className="min-w-[200px] flex-1">
            <div
              className="sticky top-0 z-10 border-b border-line bg-surface"
              style={{ height: HEADER_HEIGHT }}
            />
            <div style={{ height: bodyHeight, backgroundImage: gridLines }} />
          </div>
        ) : (
          allColumns.map((col) => {
            const placed = placeBlocks(timed.filter((e) => keyOf(e) === col.key));
            return (
              <div key={col.key} className="min-w-[180px] flex-1 border-r border-line">
                <div
                  className="sticky top-0 z-10 flex items-center border-b border-line bg-surface px-3 text-sm font-medium text-ink"
                  style={{ height: HEADER_HEIGHT }}
                >
                  <span className="truncate">{col.name}</span>
                </div>
                <div className="relative" style={{ height: bodyHeight, backgroundImage: gridLines }}>
                  {placed.map(({ entry, start, end, lane, lanes }) => {
                    const top = ((start - rangeStart) / SLOT_MINUTES) * SLOT_HEIGHT;
                    const height = Math.max(
                      SLOT_HEIGHT / 2,
                      ((end - start) / SLOT_MINUTES) * SLOT_HEIGHT,
                    );
                    const secondary = groupBy === "room" ? entry.teacher : entry.roomName;
                    return (
                      <div
                        key={entry.key}
                        className={`absolute overflow-hidden rounded-lg border px-2 py-1 ${colorFor(entry.groupName ?? entry.title)}`}
                        style={{
                          top: top + 1,
                          height: height - 2,
                          left: `calc(${(lane / lanes) * 100}% + 2px)`,
                          width: `calc(${100 / lanes}% - 4px)`,
                        }}
                        title={[entry.title, entry.subtitle, entry.teacher, entry.roomName]
                          .filter(Boolean)
                          .join(" · ")}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="truncate text-xs font-semibold">{entry.title}</div>
                          {renderActions?.(entry)}
                        </div>
                        <div className="truncate text-[11px] opacity-80">
                          {formatTime(entry.startTime)}
                          {entry.endTime ? `–${formatTime(entry.endTime)}` : ""}
                        </div>
                        {(entry.subtitle || secondary) && (
                          <div className="truncate text-[11px] opacity-80">
                            {[entry.subtitle, secondary].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {untimed.length > 0 && <UntimedStrip entries={untimed} />}
      {entries.length === 0 && (
        <p className="pb-4 text-center text-sm text-ink-faint">{emptyText}</p>
      )}
    </div>
  );
}

function UntimedStrip({ entries }: { entries: ScheduleEntry[] }) {
  return (
    <div className="mx-3 mb-3 rounded-xl border border-line p-3">
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-faint uppercase">
        Vaqti belgilanmagan
      </h3>
      <div className="flex flex-wrap gap-2">
        {entries.map((e) => (
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
  );
}

function TimetableList({
  timed,
  untimed,
  emptyText,
}: {
  timed: ScheduleEntry[];
  untimed: ScheduleEntry[];
  emptyText: string;
}) {
  const sorted = [...timed].sort(
    (a, b) => timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!),
  );

  if (timed.length === 0 && untimed.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-faint">{emptyText}</p>;
  }

  return (
    <div className="space-y-3 p-3">
      {sorted.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {sorted.map((e) => (
            <li key={e.key} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
              <span className="w-28 flex-none text-sm font-medium text-ink">
                {formatTime(e.startTime)}
                {e.endTime ? ` - ${formatTime(e.endTime)}` : ""}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{e.title}</span>
                {e.subtitle && (
                  <span className="block truncate text-xs text-ink-faint">{e.subtitle}</span>
                )}
              </span>
              <span className="w-40 truncate text-sm text-ink-muted">{e.teacher ?? "—"}</span>
              <span className="w-32 truncate text-sm text-ink-muted">{e.roomName ?? "—"}</span>
            </li>
          ))}
        </ul>
      )}
      {untimed.length > 0 && <UntimedStrip entries={untimed} />}
    </div>
  );
}
