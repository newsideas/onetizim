"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
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

export interface GridMark {
  status: AttendanceStatus;
  reason: string | null;
}

/** Kelmagan o'quvchi uchun sabab: "Sababsiz" — qizil, boshqa har qanday sabab — sababli (sariq). */
const UNEXCUSED = "Sababsiz";
const EXCUSED = "Sababli";

type Choice = "present" | "excused" | "unexcused";

const CHOICES: { key: Choice; label: string; color: string }[] = [
  { key: "present", label: "Keldi", color: "border-green-500 bg-green-50 text-green-600" },
  { key: "excused", label: "Sababli", color: "border-amber-500 bg-amber-50 text-amber-600" },
  { key: "unexcused", label: "Sababsiz", color: "border-red-500 bg-red-50 text-red-600" },
];

function choiceOf(mark: GridMark | undefined): Choice | "late" | null {
  if (!mark) return null;
  if (mark.status === "present") return "present";
  if (mark.status === "late") return "late";
  return mark.reason && mark.reason !== UNEXCUSED ? "excused" : "unexcused";
}

function Mark({ value, disabled }: { value: Choice | "late" | null; disabled: boolean }) {
  const base = "flex h-6 w-6 items-center justify-center rounded-full border";
  if (value === "present") {
    return (
      <span className={`${base} border-green-500 text-green-600`}>
        <Check size={14} aria-hidden="true" />
      </span>
    );
  }
  if (value === "excused" || value === "late") {
    return (
      <span className={`${base} border-amber-500 text-amber-600`}>
        <AlertCircle size={14} aria-hidden="true" />
      </span>
    );
  }
  if (value === "unexcused") {
    return (
      <span className={`${base} border-red-500 text-red-600`}>
        <X size={14} aria-hidden="true" />
      </span>
    );
  }
  return <span className={`${base} ${disabled ? "border-line/60" : "border-line"}`} />;
}

const VALUE_TITLES: Record<Choice | "late", string> = {
  present: "Keldi",
  excused: "Sababli",
  unexcused: "Sababsiz",
  late: "Kechikdi",
};

interface Picker {
  /** Bitta o'quvchi katagi yoki butun kun (studentId = null). */
  studentId: string | null;
  date: string;
  x: number;
  y: number;
}

/** Guruhning oylik davomat jadvali: doirani bossangiz Keldi / Sababli / Sababsiz tugmalari chiqadi. */
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
  initialMarks: Record<string, GridMark>;
  today: string;
  canMark: boolean;
  showBalance: boolean;
}) {
  const [marks, setMarks] = useState(initialMarks);
  const [picker, setPicker] = useState<Picker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!picker) return;
    const close = () => setPicker(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [picker]);

  function apply(studentId: string, date: string, choice: Choice) {
    const key = `${studentId}|${date}`;
    const previous = marks[key];
    const next: GridMark =
      choice === "present"
        ? { status: "present", reason: null }
        : { status: "absent", reason: choice === "excused" ? EXCUSED : UNEXCUSED };
    setError(null);
    setMarks((m) => ({ ...m, [key]: next }));
    startTransition(async () => {
      const result = await markAttendance(studentId, groupId, date, next.status, next.reason);
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

  function choose(choice: Choice) {
    if (!picker) return;
    if (picker.studentId) apply(picker.studentId, picker.date, choice);
    else for (const s of students) apply(s.id, picker.date, choice);
    setPicker(null);
  }

  function open(e: React.MouseEvent<HTMLButtonElement>, studentId: string | null, date: string) {
    const rect = e.currentTarget.getBoundingClientRect();
    setPicker({ studentId, date, x: rect.left + rect.width / 2, y: rect.bottom + 6 });
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
              {lessons.map((l, i) => (
                <th key={l.iso} className="px-2 py-2 text-center font-medium">
                  <div className="text-[10px] text-brand-600">{i + 1}-dars</div>
                  <div className="text-ink">{l.label}</div>
                  {canMark && l.iso <= today ? (
                    <button
                      type="button"
                      onClick={(e) => open(e, null, l.iso)}
                      title="Hammasi uchun belgilash"
                      aria-label={`${l.label} — hammasi uchun belgilash`}
                      className="mx-auto mt-1 flex rounded-full transition-opacity hover:opacity-70"
                    >
                      <Mark value={null} disabled={false} />
                    </button>
                  ) : (
                    <div className="mx-auto mt-1 flex justify-center">
                      <Mark value={null} disabled />
                    </div>
                  )}
                </th>
              ))}
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
                  const value = choiceOf(marks[`${s.id}|${l.iso}`]);
                  const locked = !canMark || l.iso > today;
                  return (
                    <td key={l.iso} className="px-2 py-2">
                      <button
                        type="button"
                        disabled={locked}
                        onClick={(e) => open(e, s.id, l.iso)}
                        title={value ? VALUE_TITLES[value] : locked ? "" : "Belgilash"}
                        aria-label={`${s.name}, ${l.label}: ${value ? VALUE_TITLES[value] : "belgilanmagan"}`}
                        className="mx-auto flex rounded-full transition-opacity enabled:hover:opacity-70 disabled:cursor-default"
                      >
                        <Mark value={value} disabled={locked} />
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

      {picker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setPicker(null)} aria-hidden="true" />
          <div
            role="menu"
            aria-label="Davomat holati"
            style={{ left: picker.x, top: picker.y }}
            className="fixed z-50 flex -translate-x-1/2 gap-1.5 rounded-xl border border-line bg-surface p-1.5 shadow-lg"
          >
            {CHOICES.map((c) => (
              <button
                key={c.key}
                type="button"
                role="menuitem"
                onClick={() => choose(c.key)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 ${c.color}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </>
      )}

      <p className="text-xs text-ink-faint">
        Doirani bosing va holatni tanlang: Keldi (yashil), Sababli (sariq), Sababsiz (qizil). Sarlavhadagi doira shu kun
        hammasi uchun belgilaydi.
      </p>
    </div>
  );
}
