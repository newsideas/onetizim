"use client";

import { unwrap } from "@/lib/actions/result";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateStudentStatus } from "@/lib/actions/students";
import { STUDENT_STATUS_LABELS } from "@/lib/validations/student";
import { FormError } from "@/components/ui/FormError";
import { useDialogs } from "@/components/ui/ConfirmDialog";
import type { StudentStatus } from "@/types/database";

const STATUS_ORDER: StudentStatus[] = ["active", "frozen", "archived"];

export function StudentStatusActions({
  studentId,
  status,
}: {
  studentId: string;
  status: StudentStatus;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<StudentStatus>(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { prompt, dialogs } = useDialogs();

  async function handleChange(next: StudentStatus) {
    if (next === current || pending) return;

    // Arxivlanganda ketish sababi so'raladi (ixtiyoriy); "Bekor" bosilsa o'zgarish to'xtatiladi.
    let reason: string | undefined;
    if (next === "archived") {
      const answer = await prompt("Ketish sababi (ixtiyoriy, masalan: narx qimmat, ko'chib ketdi):", {
        title: "Arxivga o'tkazish",
        placeholder: "Ketish sababi",
        confirmLabel: "Arxivlash",
      });
      if (answer === null) return;
      reason = answer;
    }

    const previous = current;
    setCurrent(next);
    setError(null);
    setPending(true);

    try {
      unwrap(await updateStudentStatus(studentId, next, reason));
      // router.refresh() ataylab transition tashqarisida — transition
      // ichida chaqirilsa sahifa eski ma'lumot bilan qolib ketadi.
      router.refresh();
    } catch (e) {
      setCurrent(previous);
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      {dialogs}
      <div className="flex flex-wrap gap-2">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleChange(s)}
            disabled={pending}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
              current === s
                ? "bg-brand-600 text-white"
                : "bg-canvas text-ink-muted hover:bg-line"
            }`}
          >
            {STUDENT_STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      <FormError message={error ?? undefined} />
    </div>
  );
}
