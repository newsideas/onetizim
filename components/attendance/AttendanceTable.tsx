"use client";

import { useState, useTransition } from "react";
import { markAttendance, type AttendanceStudent } from "@/lib/actions/attendance";
import { markLessonAllPresent, markLessonAttendance } from "@/lib/actions/lesson-attendance";
import type { AttendanceStatus } from "@/types/database";
import { ABSENCE_REASONS } from "@/lib/attendance-reasons";

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Bor",
  absent: "Yo'q",
  late: "Kech",
};

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-green-600 text-white",
  absent: "bg-red-600 text-white",
  late: "bg-amber-500 text-white",
};

const STATUS_ORDER: AttendanceStatus[] = ["present", "absent", "late"];

export function AttendanceTable({
  initialStudents,
  groupId,
  date,
  lessonId,
}: {
  initialStudents: AttendanceStudent[];
  groupId: string;
  date: string;
  /** Maktab: berilsa davomat shu dars (fan soati) uchun belgilanadi. */
  lessonId?: string;
}) {
  const [students, setStudents] = useState(initialStudents);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleMark(studentId: string, status: AttendanceStatus, reason: string | null = null) {
    const before = students.find((s) => s.id === studentId);
    const previous = before?.status ?? null;
    const previousReason = before?.reason ?? null;
    setError(null);
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status, reason: status === "absent" ? reason : null } : s)),
    );
    startTransition(async () => {
      const result = lessonId
        ? await markLessonAttendance(lessonId, studentId, date, status, reason)
        : await markAttendance(studentId, groupId, date, status, reason);
      if (!result.ok) {
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, status: previous, reason: previousReason } : s)),
        );
        setError(result.error);
      }
    });
  }

  function markAllPresent() {
    if (!lessonId) return;
    const snapshot = students;
    setError(null);
    setStudents((prev) => prev.map((s) => (s.status ? s : { ...s, status: "present", reason: null })));
    startTransition(async () => {
      const result = await markLessonAllPresent(lessonId, date);
      if (!result.ok) {
        setStudents(snapshot);
        setError(result.error);
      }
    });
  }

  const unmarked = students.filter((s) => !s.status).length;

  if (students.length === 0) {
    return (
      <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
        Bu guruhda o&apos;quvchi yo&apos;q.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {lessonId && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted">
          <span>
            Belgilanmagan: <b className="text-ink">{unmarked}</b> / {students.length}
          </span>
          <button
            type="button"
            onClick={markAllPresent}
            disabled={isPending || unmarked === 0}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Qolganlarni &quot;Keldi&quot; deb belgilash
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Ism familiyasi</th>
              <th className="px-4 py-3 font-medium">Davomat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-canvas">
                <td className="px-4 py-3 text-ink">{student.full_name}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {STATUS_ORDER.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleMark(student.id, status)}
                        disabled={isPending}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                          student.status === status
                            ? STATUS_COLORS[status]
                            : "bg-canvas text-ink-muted hover:bg-line"
                        }`}
                      >
                        {STATUS_LABELS[status]}
                      </button>
                    ))}
                    {student.status === "absent" && (
                      <select
                        aria-label="Kelmagan sababi"
                        value={student.reason ?? ""}
                        onChange={(e) => handleMark(student.id, "absent", e.target.value || null)}
                        disabled={isPending}
                        className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink focus:border-brand-500 focus:outline-none"
                      >
                        <option value="">Sababi</option>
                        {ABSENCE_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
