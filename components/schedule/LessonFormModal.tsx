"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { financeInputClass } from "@/components/finance/MoneyEntryModal";
import { createLessons, updateLesson } from "@/lib/actions/lessons";
import { HAFTA_KUNLARI, formatTime } from "@/lib/utils/date";
import type { EditableLesson } from "@/components/schedule/schedule-entries";

export interface LessonOptions {
  groups: { id: string; name: string }[];
  teachers: { id: string; full_name: string }[];
  rooms: { id: string; name: string }[];
}

const labelClass = "mb-1.5 block text-xs font-medium text-ink-muted";

/** `lesson` berilsa tahrirlash (bitta kun), berilmasa yangi dars (bir necha kun). */
export function LessonFormModal({
  options,
  lesson,
  onClose,
}: {
  options: LessonOptions;
  lesson?: EditableLesson;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const isEdit = Boolean(lesson);

  const [groupId, setGroupId] = useState(lesson?.groupId ?? "");
  const [subject, setSubject] = useState(lesson?.subject ?? "");
  const [teacherId, setTeacherId] = useState(lesson?.teacherId ?? "");
  const [roomId, setRoomId] = useState(lesson?.roomId ?? "");
  const [weekdays, setWeekdays] = useState<number[]>(lesson ? [lesson.weekday] : []);
  const [startTime, setStartTime] = useState(lesson ? formatTime(lesson.startTime) : "");
  const [endTime, setEndTime] = useState(lesson ? formatTime(lesson.endTime) : "");

  function toggleDay(day: number) {
    if (isEdit) return setWeekdays([day]);
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const values = { groupId, subject, teacherId, roomId, weekdays, startTime, endTime };
      const result = lesson ? await updateLesson(lesson.id, values) : await createLessons(values);
      if (!result.ok) return setError(result.error);
      router.refresh();
      onClose();
    });
  }

  return (
    <Modal
      open
      onClose={isPending ? () => {} : onClose}
      title={isEdit ? "Darsni tahrirlash" : "Yangi dars"}
    >
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="lesson-group" className={labelClass}>
              Sinf <span className="text-red-500">*</span>
            </label>
            <select
              id="lesson-group"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              disabled={isPending}
              className={financeInputClass}
            >
              <option value="">Tanlang</option>
              {options.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lesson-subject" className={labelClass}>
              Fan <span className="text-red-500">*</span>
            </label>
            <input
              id="lesson-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={80}
              placeholder="Matematika"
              disabled={isPending}
              className={financeInputClass}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="lesson-teacher" className={labelClass}>
              O&apos;qituvchi
            </label>
            <select
              id="lesson-teacher"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              disabled={isPending}
              className={financeInputClass}
            >
              <option value="">Ko&apos;rsatilmagan</option>
              {options.teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lesson-room" className={labelClass}>
              Xona
            </label>
            <select
              id="lesson-room"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              disabled={isPending}
              className={financeInputClass}
            >
              <option value="">Ko&apos;rsatilmagan</option>
              {options.rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <span className={labelClass}>
            {isEdit ? "Kun" : "Kunlar"} <span className="text-red-500">*</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {HAFTA_KUNLARI.map((day, i) => (
              <button
                key={day}
                type="button"
                aria-pressed={weekdays.includes(i + 1)}
                onClick={() => toggleDay(i + 1)}
                disabled={isPending}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  weekdays.includes(i + 1)
                    ? "bg-brand-600 text-white"
                    : "bg-canvas text-ink-muted hover:bg-line"
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="lesson-start" className={labelClass}>
              Boshlanishi <span className="text-red-500">*</span>
            </label>
            <input
              id="lesson-start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={isPending}
              className={financeInputClass}
            />
          </div>
          <div>
            <label htmlFor="lesson-end" className={labelClass}>
              Tugashi <span className="text-red-500">*</span>
            </label>
            <input
              id="lesson-end"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={isPending}
              className={financeInputClass}
            />
          </div>
        </div>

        <FormError message={error} />

        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Bekor qilish
          </Button>
        </div>
      </form>
    </Modal>
  );
}
