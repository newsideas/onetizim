"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteGrade } from "@/lib/actions/grades";
import { useDialogs } from "@/components/ui/ConfirmDialog";

const SCORE_CLASS: Record<number, string> = {
  5: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  4: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  3: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  2: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  1: "bg-red-200 text-red-900 dark:bg-red-500/25 dark:text-red-200",
};

/** Bitta baho; bosilsa (tasdiqdan keyin) o'chiriladi. */
export function GradeChip({
  id,
  score,
  title,
}: {
  id: string;
  score: number;
  title: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const { confirm, dialogs } = useDialogs();

  async function remove() {
    const question = `${title}\n\nShu bahoni o'chirmoqchimisiz?`;
    if (!(await confirm(question, { danger: true, confirmLabel: "O'chirish" }))) return;
    setError(undefined);
    startTransition(async () => {
      const result = await deleteGrade(id);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={remove}
        disabled={isPending}
        title={error ?? title}
        aria-label={`${title} — o'chirish`}
        className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-xs font-semibold transition-opacity hover:opacity-70 disabled:opacity-40 ${
          error ? "ring-2 ring-red-500" : ""
        } ${SCORE_CLASS[score] ?? ""}`}
      >
        {score}
      </button>
      {dialogs}
    </>
  );
}
