"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateStudentStatus } from "@/lib/actions/students";
import { STUDENT_STATUS_LABELS } from "@/lib/validations/student";
import { FormError } from "@/components/ui/FormError";
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

  async function handleChange(next: StudentStatus) {
    if (next === current || pending) return;

    const previous = current;
    setCurrent(next);
    setError(null);
    setPending(true);

    try {
      await updateStudentStatus(studentId, next);
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
      <div className="flex flex-wrap gap-2">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleChange(s)}
            disabled={pending}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
              current === s
                ? "bg-blue-600 text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10"
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
