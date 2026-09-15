"use client";

import { useState, useTransition } from "react";
import { markAttendance, type AttendanceStudent } from "@/lib/actions/attendance";
import type { AttendanceStatus } from "@/types/database";

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
}: {
  initialStudents: AttendanceStudent[];
  groupId: string;
  date: string;
}) {
  const [students, setStudents] = useState(initialStudents);
  const [isPending, startTransition] = useTransition();

  function handleMark(studentId: string, status: AttendanceStatus) {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s)),
    );
    startTransition(async () => {
      await markAttendance(studentId, groupId, date, status);
    });
  }

  if (students.length === 0) {
    return (
      <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
        Bu guruhda o&apos;quvchi yo&apos;q.
      </div>
    );
  }

  return (
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
                <div className="flex gap-2">
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
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
