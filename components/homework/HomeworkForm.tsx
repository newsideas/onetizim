"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { financeInputClass } from "@/components/finance/MoneyEntryModal";
import { createHomework } from "@/lib/actions/homework";

const labelClass = "mb-1.5 block text-xs font-medium text-ink-muted";

/** Sinfga yangi uy vazifasi berish. */
export function HomeworkForm({
  groupId,
  subjects,
  defaultSubject,
  today,
}: {
  groupId: string;
  subjects: string[];
  defaultSubject: string;
  today: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  const [subject, setSubject] = useState(defaultSubject);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [dueOn, setDueOn] = useState(today);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setSaved(false);
    startTransition(async () => {
      const result = await createHomework({ groupId, subject, title, details, dueOn });
      if (!result.ok) return setError(result.error);
      setTitle("");
      setDetails("");
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-line p-4" noValidate>
      <h2 className="text-sm font-semibold text-ink">Yangi uy vazifasi</h2>

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
