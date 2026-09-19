"use client";

import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { deleteLesson } from "@/lib/actions/lessons";

/** Server komponentdagi jadvaldan chaqiriladi, shuning uchun action shu yerda bog'lanadi. */
export function LessonDeleteButton({ lessonId, title }: { lessonId: string; title: string }) {
  return (
    <ConfirmActionButton
      action={() => deleteLesson(lessonId)}
      confirmText={`"${title}" darsini jadvaldan o'chirmoqchimisiz?`}
    />
  );
}
