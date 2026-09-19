"use client";

import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { deleteHomework } from "@/lib/actions/homework";

/** Server komponentdagi ro'yxatdan chaqiriladi, shuning uchun action shu yerda bog'lanadi. */
export function HomeworkDeleteButton({ homeworkId, title }: { homeworkId: string; title: string }) {
  return (
    <ConfirmActionButton
      action={() => deleteHomework(homeworkId)}
      confirmText={`"${title}" vazifasini o'chirmoqchimisiz?`}
    />
  );
}
