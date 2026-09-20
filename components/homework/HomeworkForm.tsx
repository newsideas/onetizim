"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { financeInputClass } from "@/components/finance/MoneyEntryModal";
import { createHomework } from "@/lib/actions/homework";
import { HOMEWORK_KINDS } from "@/lib/validations/homework";

const labelClass = "mb-1.5 block text-xs font-medium text-ink-muted";

/** Sinfga yangi uy vazifasi berish. */
export function HomeworkForm({
  groupId,
  groups,
  subjects,
  defaultSubject,
  today,
  onSaved,
}: {
  /** Aniq sinf uchun; berilmasa `groups` dan tanlanadi. */
  groupId?: string;
  /** Berilsa forma ichida guruh tanlovi chiqadi (Barcha vazifalar sahifasi). */
  groups?: { id: string; name: string }[];
  onSaved?: () => void;
  subjects: string[];
  defaultSubject: string;
  today: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  const [kind, setKind] = useState<(typeof HOMEWORK_KINDS)[number]>("Uy vazifasi");
  const [subject, setSubject] = useState(defaultSubject);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [dueOn, setDueOn] = useState(today);
  const [maxScore, setMaxScore] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(groupId ?? groups?.[0]?.id ?? "");

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setSaved(false);
    startTransition(async () => {
      const result = await createHomework({
        kind,
        groupId: selectedGroup,
        subject,
        title,
        details,
        dueOn,
        maxScore: maxScore.trim() === "" ? null : Number(maxScore),
      });
      if (!result.ok) return setError(result.error);
      setTitle("");
      setDetails("");
      setMaxScore("");
      setSaved(true);
      router.refresh();
      onSaved?.();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-line p-4" noValidate>
      <h2 className="text-sm font-semibold text-ink">Yangi uy vazifasi</h2>

      {groups && (
        <div>
          <label htmlFor="hw-group" className={labelClass}>
            Guruh <span className="text-red-500">*</span>
          </label>
          <select
            id="hw-group"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            disabled={isPending}
            className={financeInputClass}
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="hw-kind" className={labelClass}>
          Turi
        </label>
        <select
          id="hw-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as (typeof HOMEWORK_KINDS)[number])}
          disabled={isPending}
          className={financeInputClass}
        >
          {HOMEWORK_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="hw-subject" className={labelClass}>
            Fan <span className="text-red-500">*</span>
          </label>
          <input
            id="hw-subject"
            list="hw-subjects"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={80}
            disabled={isPending}
            className={financeInputClass}
          />
          <datalist id="hw-subjects">
            {subjects.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="hw-title" className={labelClass}>
            Vazifa <span className="text-red-500">*</span>
          </label>
          <input
            id="hw-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            placeholder="Masalan: 45-bet, 3–7-mashqlar"
            disabled={isPending}
            className={financeInputClass}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="hw-max" className={labelClass}>
            Maksimal ball
          </label>
          <input
            id="hw-max"
            type="number"
            min={1}
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            disabled={isPending}
            className={financeInputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="hw-details" className={labelClass}>
            Izoh
          </label>
          <textarea
            id="hw-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={2000}
            rows={2}
            disabled={isPending}
            className={financeInputClass}
          />
        </div>
        <div>
          <label htmlFor="hw-due" className={labelClass}>
            Topshirish sanasi <span className="text-red-500">*</span>
          </label>
          <input
            id="hw-due"
            type="date"
            value={dueOn}
            onChange={(e) => setDueOn(e.target.value)}
            disabled={isPending}
            className={financeInputClass}
          />
        </div>
      </div>

      <FormError message={error} />
      {saved && <p className="text-sm text-emerald-600 dark:text-emerald-400">Vazifa saqlandi</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saqlanmoqda..." : "Vazifa berish"}
      </Button>
    </form>
  );
}
