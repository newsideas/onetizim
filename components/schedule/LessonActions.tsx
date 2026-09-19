"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { LessonFormModal, type LessonOptions } from "@/components/schedule/LessonFormModal";
import type { EditableLesson } from "@/components/schedule/schedule-entries";
import { deleteLesson } from "@/lib/actions/lessons";

/** Jadvaldagi dars kartasi uchun tahrirlash va o'chirish tugmalari. */
export function LessonActions({
  lesson,
  title,
  options,
}: {
  lesson: EditableLesson;
  title: string;
  options: LessonOptions;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Tahrirlash"
        title="Tahrirlash"
        className="rounded p-1 text-ink-faint transition-colors hover:bg-line hover:text-ink"
      >
        <Pencil size={14} aria-hidden="true" />
      </button>
      <ConfirmActionButton
        action={() => deleteLesson(lesson.id)}
        confirmText={`"${title}" darsini jadvaldan o'chirmoqchimisiz?`}
      />
      {editing && (
        <LessonFormModal options={options} lesson={lesson} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}
