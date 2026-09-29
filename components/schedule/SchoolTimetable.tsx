"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { LessonActions } from "@/components/schedule/LessonActions";
import { LessonFormModal, type LessonOptions } from "@/components/schedule/LessonFormModal";
import type { LessonRow } from "@/components/schedule/schedule-entries";
import { HAFTA_KUNLARI, formatTime, timeToMinutes } from "@/lib/utils/date";

export interface LessonSlot {
  position: number;
  start: string;
  end: string;
}

type Mode = "class" | "teacher";

/** Maktab haftasi: Dushanba–Shanba (1–6). */
const WEEKDAYS = [1, 2, 3, 4, 5, 6];

/**
 * Dars vaqtlari ma'lumotnomasi bo'sh bo'lsa, soatlar mavjud darslarning vaqtlaridan olinadi
 * (jadval baribir ko'rinsin).
 */
function slotsFromLessons(lessons: LessonRow[]): LessonSlot[] {
  const seen = new Map<string, LessonSlot>();
  for (const l of lessons) {
    const key = `${formatTime(l.start_time)}-${formatTime(l.end_time)}`;
    if (!seen.has(key)) seen.set(key, { position: 0, start: l.start_time, end: l.end_time });
  }
  return [...seen.values()]
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start))
    .map((s, i) => ({ ...s, position: i + 1 }));
}

/**
 * Xususiy maktab dars jadvali: tanlangan sinf (yoki o'qituvchi) uchun hafta to'ri —
 * satrlar dars soatlari, ustunlar kunlar. Bo'sh katak bosilsa shu kun va soatga dars qo'shiladi.
 */
export function SchoolTimetable({
  classes,
  teachers,
  lessons,
  slots: configuredSlots,
  options,
}: {
  classes: { id: string; name: string }[];
  teachers: { id: string; full_name: string }[];
  lessons: LessonRow[];
  slots: LessonSlot[];
  /** null — faqat ko'rish (dars qo'shish/tahrirlash ruxsati yo'q). */
  options: LessonOptions | null;
}) {
  const [mode, setMode] = useState<Mode>("class");
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "");
  const [adding, setAdding] = useState<{ weekday: number; slot: LessonSlot } | null>(null);

  const slots = configuredSlots.length > 0 ? configuredSlots : slotsFromLessons(lessons);
  const selectedId = mode === "class" ? classId : teacherId;

  const visible = useMemo(
    () => lessons.filter((l) => (mode === "class" ? l.group_id === classId : l.teacher_id === teacherId)),
    [lessons, mode, classId, teacherId],
  );

  function cellLessons(weekday: number, slot: LessonSlot) {
    const start = timeToMinutes(slot.start);
    const end = timeToMinutes(slot.end);
    return visible.filter(
      (l) =>
        l.weekday === weekday && timeToMinutes(l.start_time) < end && timeToMinutes(l.end_time) > start,
    );
  }

  const weeklyHours = visible.length;
  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? "bg-brand-600 text-white" : "text-ink-muted hover:bg-line"
    }`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-canvas p-1">
          <button type="button" onClick={() => setMode("class")} className={tabClass(mode === "class")}>
            Sinf bo&apos;yicha
          </button>
          <button type="button" onClick={() => setMode("teacher")} className={tabClass(mode === "teacher")}>
            O&apos;qituvchi bo&apos;yicha
          </button>
        </div>

        {mode === "class" ? (
          <select
            aria-label="Sinf"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            {classes.length === 0 && <option value="">Sinf yo&apos;q</option>}
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          <select
            aria-label="O'qituvchi"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            {teachers.length === 0 && <option value="">O&apos;qituvchi yo&apos;q</option>}
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        )}

        <span className="ml-auto rounded-lg border border-line px-2.5 py-1 text-xs text-ink-muted">
          Haftalik darslar: <b className="text-ink">{weeklyHours}</b>
        </span>
      </div>

      {configuredSlots.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Dars soatlari belgilanmagan.{" "}
          <Link href="/settings/references/lesson-times" className="font-medium underline">
            Dars vaqtlari
          </Link>{" "}
          bo&apos;limida 1-soat, 2-soat… vaqtlarini kiriting — jadval shu soatlar bo&apos;yicha tuziladi.
        </p>
      )}

      {classes.length === 0 ? (
        <div className="rounded-xl border border-line p-8 text-center text-sm text-ink-muted">
          Avval{" "}
          <Link href="/education/groups" className="font-medium text-brand-600 hover:underline">
            Sinflar
          </Link>{" "}
          bo&apos;limida sinf oching.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-canvas text-xs text-ink-muted">
              <tr>
                <th className="w-28 border-b border-line px-3 py-2 text-left font-medium">Soat</th>
                {WEEKDAYS.map((d) => (
                  <th key={d} className="border-b border-l border-line px-3 py-2 text-left font-medium">
                    {HAFTA_KUNLARI[d - 1]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.length === 0 && (
                <tr>
                  <td colSpan={WEEKDAYS.length + 1} className="px-4 py-10 text-center text-ink-muted">
                    Hali dars qo&apos;shilmagan.
                  </td>
                </tr>
              )}
              {slots.map((slot) => (
                <tr key={`${slot.position}-${slot.start}`} className="align-top">
                  <td className="border-b border-line px-3 py-2 whitespace-nowrap">
                    <div className="font-medium text-ink">{slot.position}-soat</div>
                    <div className="text-xs text-ink-faint">
                      {formatTime(slot.start)}–{formatTime(slot.end)}
                    </div>
                  </td>
                  {WEEKDAYS.map((weekday) => {
                    const items = cellLessons(weekday, slot);
                    return (
                      <td key={weekday} className="h-16 border-b border-l border-line p-1.5">
                        {items.map((l) => (
                          <div
                            key={l.id}
                            className="mb-1 rounded-lg bg-brand-50 px-2 py-1.5 last:mb-0 dark:bg-brand-500/10"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0">
                                <div className="truncate font-medium text-ink">{l.subject}</div>
                                <div className="truncate text-xs text-ink-muted">
                                  {mode === "class"
                                    ? (l.teacher?.full_name ?? "O'qituvchi yo'q")
                                    : (l.group?.name ?? "—")}
                                  {l.room ? ` · ${l.room.name}` : ""}
                                </div>
                              </div>
                              {options && (
                                <LessonActions
                                  title={l.subject}
                                  options={options}
                                  lesson={{
                                    id: l.id,
                                    groupId: l.group_id,
                                    subject: l.subject,
                                    teacherId: l.teacher_id,
                                    roomId: l.room_id,
                                    weekday: l.weekday,
                                    startTime: l.start_time,
                                    endTime: l.end_time,
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                        {items.length === 0 && options && mode === "class" && selectedId && (
                          <button
                            type="button"
                            onClick={() => setAdding({ weekday, slot })}
                            aria-label={`${HAFTA_KUNLARI[weekday - 1]}, ${slot.position}-soat: dars qo'shish`}
                            className="flex h-full min-h-12 w-full items-center justify-center rounded-lg text-ink-faint opacity-0 transition-opacity hover:bg-canvas hover:opacity-100 focus-visible:opacity-100"
                          >
                            <Plus size={16} aria-hidden="true" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding && options && (
        <LessonFormModal
          options={options}
          preset={{
            groupId: classId,
            weekday: adding.weekday,
            startTime: formatTime(adding.slot.start),
            endTime: formatTime(adding.slot.end),
          }}
          onClose={() => setAdding(null)}
        />
      )}
    </div>
  );
}
