"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { financeInputClass } from "@/components/finance/MoneyEntryModal";
import { saveGrades } from "@/lib/actions/grades";
import {
  GRADE_KINDS,
  GRADE_KIND_LABELS,
  GRADE_SCORES,
  type GradeKind,
} from "@/lib/validations/grade";

const labelClass = "mb-1.5 block text-xs font-medium text-ink-muted";

/** Bir sinf uchun bir martada baho qo'yish jurnali: fan, tur, sana va har o'quvchiga baho. */
export function GradeJournal({
  groupId,
  students,
  subject: initialSubject,
  subjects,
  today,
}: {
  groupId: string;
  students: { id: string; full_name: string }[];
  subject: string;
  subjects: string[];
  today: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  const [subject, setSubject] = useState(initialSubject);
  const [kind, setKind] = useState<GradeKind>("homework");
  const [gradedOn, setGradedOn] = useState(today);
  const [picked, setPicked] = useState<Record<string, number>>({});

  const pickedCount = Object.keys(picked).length;

  function pick(studentId: string, score: number) {
    setPicked((prev) => {
      if (prev[studentId] === score) {
        const next = { ...prev };
        delete next[studentId];
        return next;
      }
      return { ...prev, [studentId]: score };
    });
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setMessage(undefined);
    startTransition(async () => {
      const result = await saveGrades({
        groupId,
        subject,
        kind,
        gradedOn,
        scores: Object.entries(picked).map(([studentId, score]) => ({ studentId, score })),
      });
      if (!result.ok) return setError(result.error);
      setPicked({});
      setMessage(`${result.data.saved} ta baho saqlandi`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-line p-4" noValidate>
      <h2 className="text-sm font-semibold text-ink">Baho qo&apos;yish</h2>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="journal-subject" className={labelClass}>
            Fan <span className="text-red-500">*</span>
          </label>
          <input
            id="journal-subject"
            list="journal-subjects"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={80}
            placeholder="Matematika"
            disabled={isPending}
            className={financeInputClass}
          />
          <datalist id="journal-subjects">
            {subjects.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="journal-kind" className={labelClass}>
            Turi
          </label>
          <select
            id="journal-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as GradeKind)}
            disabled={isPending}
            className={financeInputClass}
          >
            {GRADE_KINDS.map((k) => (
              <option key={k} value={k}>
                {GRADE_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="journal-date" className={labelClass}>
            Sana
          </label>
          <input
            id="journal-date"
            type="date"
            value={gradedOn}
            onChange={(e) => setGradedOn(e.target.value)}
            disabled={isPending}
            className={financeInputClass}
          />
        </div>
      </div>

      <ul className="divide-y divide-line rounded-lg border border-line">
        {students.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
            <span className="text-sm text-ink">{s.full_name}</span>
            <div className="flex gap-1.5" role="group" aria-label={`${s.full_name} bahosi`}>
              {GRADE_SCORES.map((score) => (
                <button
                  key={score}
                  type="button"
                  aria-pressed={picked[s.id] === score}
                  onClick={() => pick(s.id, score)}
                  disabled={isPending}
                  className={`h-8 w-8 rounded-lg text-sm font-semibold transition-colors ${
                    picked[s.id] === score
                      ? "bg-brand-600 text-white"
                      : "bg-canvas text-ink-muted hover:bg-line"
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <FormError message={error} />
      {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}

      <Button type="submit" disabled={isPending || pickedCount === 0}>
        {isPending ? "Saqlanmoqda..." : `Saqlash${pickedCount ? ` (${pickedCount})` : ""}`}
      </Button>
    </form>
  );
}
