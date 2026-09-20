"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AlertCircle, Check, X } from "lucide-react";
import { markAttendance } from "@/lib/actions/attendance";
import type { AttendanceStatus } from "@/types/database";
import { BalanceBadge } from "@/components/payments/BalanceBadge";

export interface GridStudent {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
  /** Oy bo'yicha o'rtacha baho (bo'lmasa null). */
  avgGrade: number | null;
}

export interface GridLesson {
  iso: string;
  /** "09.09" ko'rinishidagi qisqa sana. */
  label: string;
}

const NEXT_STATUS: Record<AttendanceStatus, AttendanceStatus> = {
  present: "late",
  late: "absent",
  absent: "present",
};

const STATUS_TITLES: Record<AttendanceStatus, string> = {
  present: "Keldi",
  late: "Kechikdi",
  absent: "Kelmadi",
};

function Mark({ status, disabled }: { status: AttendanceStatus | null; disabled: boolean }) {
  const base = "flex h-6 w-6 items-center justify-center rounded-full border";
  if (status === "present") {
    return (
      <span className={`${base} border-green-500 text-green-600`}>
        <Check size={14} aria-hidden="true" />
      </span>
    );
  }
  if (status === "late") {
    return (
      <span className={`${base} border-amber-500 text-amber-600`}>
        <AlertCircle size={14} aria-hidden="true" />
      </span>
    );
  }
  if (status === "absent") {
    return (
      <span className={`${base} border-red-500 text-red-600`}>
        <X size={14} aria-hidden="true" />
      </span>
    );
  }
  return <span className={`${base} ${disabled ? "border-line/60" : "border-line"}`} />;
}

/** Guruhning oylik davomat jadvali: ustunlar — dars kunlari, katakka bosib holat almashtiriladi. */
export function GroupAttendanceGrid({
  groupId,
  students,
  lessons,
  initialMarks,
  today,
  canMark,
  showBalance,
}: {
  groupId: string;
  students: GridStudent[];
  lessons: GridLesson[];
  /** Kalit: `${studentId}|${sana}`. */
  initialMarks: Record<string, AttendanceStatus>;
  today: string;
  canMark: boolean;
  showBalance: boolean;
}) {
  const [marks, setMarks] = useState(initialMarks);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function set(studentId: string, date: string, status: AttendanceStatus) {
    const key = `${studentId}|${date}`;
    const previous = marks[key];
    setError(null);
    setMarks((m) => ({ ...m, [key]: status }));
    startTransition(async () => {
      const result = await markAttendance(studentId, groupId, date, status);
      if (!result.ok) {
        setError(result.error);
        setMarks((m) => {
          const copy = { ...m };
          if (previous) copy[key] = previous;
          else delete copy[key];
          return copy;
        });
      }
    });
  }

  function toggle(studentId: string, date: string) {
    const current = marks[`${studentId}|${date}`];
    set(studentId, date, current ? NEXT_STATUS[current] : "present");
  }

  function markAll(date: string) {
    for (const s of students) {
      if (marks[`${s.id}|${date}`] !== "present") set(s.id, date, "present");
    }
  }

  if (lessons.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-ink-muted">Bu oyda dars kunlari yo&apos;q.</p>;
  }

  return (
    <div className="space-y-2">
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-max text-sm">
          <thead className="bg-canvas text-xs text-ink-muted">
            <tr>
              <th className="sticky left-0 z-10 w-8 bg-canvas px-3 py-2 text-left font-medium">№</th>
              <th className="sticky left-8 z-10 bg-canvas px-3 py-2 text-left font-medium">Ism</th>
              <th className="px-3 py-2 text-left font-medium">Telefon</th>
              {showBalance && <th className="px-3 py-2 text-right font-medium">Balans</th>}
              {lessons.map((l, i) => {
                const future = l.iso > today;
                return (
                  <th key={l.iso} className="px-2 py-2 text-center font-medium">
                    <div className="text-[10px] text-brand-600">{i + 1}-dars</div>
                    <div className="text-ink">{l.label}</div>
                    {canMark && !future ? (
                      <button
                        type="button"
                        onClick={() => markAll(l.iso)}
                        title="Hammasini keldi deb belgilash"
                        aria-label={`${l.label} — hammasini keldi deb belgilash`}
                        className="mx-auto mt-1 flex rounded-full transition-opacity hover:opacity-70"
                      >
                        <Mark status={null} disabled={false} />
                      </button>
                    ) : (
                      <div className="mx-auto mt-1 flex justify-center">
                        <Mark status={null} disabled />
                      </div>
                    )}
                  </th>
                );
              })}
              <th className="px-3 py-2 text-center font-medium">O&apos;rtacha baho</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {students.map((s, idx) => (
              <tr key={s.id} className="hover:bg-canvas/50">
                <td className="sticky left-0 bg-surface px-3 py-2 text-ink-faint">{idx + 1}</td>
                <td className="sticky left-8 bg-surface px-3 py-2 font-medium whitespace-nowrap text-ink">
                  <Link href={`/education/students/${s.id}`} className="hover:text-brand-600 hover:underline">
                    {s.name}
                  </Link>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-ink-muted">{s.phone || "—"}</td>
                {showBalance && (
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <BalanceBadge balance={s.balance} />
                  </td>
                )}
                {lessons.map((l) => {
                  const status = marks[`${s.id}|${l.iso}`] ?? null;
                  const locked = !canMark || l.iso > today;
                  return (
                    <td key={l.iso} className="px-2 py-2">
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => toggle(s.id, l.iso)}
                        title={status ? STATUS_TITLES[status] : locked ? "" : "Belgilash"}
                        aria-label={`${s.name}, ${l.label}: ${status ? STATUS_TITLES[status] : "belgilanmagan"}`}
                        className="mx-auto flex rounded-full transition-opacity enabled:hover:opacity-70 disabled:cursor-default"
                      >
                        <Mark status={status} disabled={locked} />
                      </button>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-center text-ink-muted">{s.avgGrade === null ? "—" : s.avgGrade.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-faint">
        Katakka bosing: keldi → kechikdi → kelmadi. Sarlavhadagi doira — shu kun hammasini &quot;keldi&quot; deb belgilaydi.
      </p>
    </div>
  );
}
