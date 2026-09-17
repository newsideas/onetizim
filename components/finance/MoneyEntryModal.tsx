"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import type { ActionResult } from "@/lib/actions/result";
import { todayIso } from "@/lib/utils/date";
import { METHOD_LABELS } from "@/lib/validations/payment";
import { PAYMENT_METHODS } from "@/lib/validations/finance";
import type { PaymentMethod } from "@/types/database";

export const financeInputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none disabled:opacity-60";

export interface MoneyValues {
  amount: number;
  method: PaymentMethod;
  date: string;
  note: string;
}

/** Summa, usul, sana va izohli umumiy forma (xarajat, oylik to'lovi). */
export function MoneyEntryModal({
  title,
  dateLabel,
  defaultAmount,
  children,
  onSubmit,
  onClose,
}: {
  title: string;
  dateLabel: string;
  defaultAmount?: number;
  /** Formaning o'ziga xos maydoni (xarajat turi, xodim va h.k.). */
  children?: ReactNode;
  /** Qo'shimcha maydon noto'g'ri bo'lsa xato matnini qaytaradi. */
  onSubmit: (values: MoneyValues) => Promise<ActionResult> | string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : "");
  const [method, setMethod] = useState<PaymentMethod>("naqd");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    const value = Number(amount);
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) {
      return setError("Summani kiriting");
    }

    const pending = onSubmit({ amount: value, method, date, note });
    if (typeof pending === "string") return setError(pending);

    startTransition(async () => {
      const result = await pending;
      if (!result.ok) return setError(result.error);
      router.refresh();
      onClose();
    });
  }

  return (
    <Modal open onClose={isPending ? () => {} : onClose} title={title}>
      <form onSubmit={submit} className="space-y-3">
        {children}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="money-amount" className="mb-1.5 block text-xs font-medium text-ink-muted">
              Summa (so&apos;m) <span className="text-red-500">*</span>
            </label>
            <input
              id="money-amount"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isPending}
              className={financeInputClass}
            />
          </div>
          <div>
            <label htmlFor="money-method" className="mb-1.5 block text-xs font-medium text-ink-muted">
              To&apos;lov usuli
            </label>
            <select
              id="money-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              disabled={isPending}
              className={financeInputClass}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {METHOD_LABELS[m]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="money-date" className="mb-1.5 block text-xs font-medium text-ink-muted">
            {dateLabel}
          </label>
          <input
            id="money-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isPending}
            className={financeInputClass}
          />
        </div>

        <div>
          <label htmlFor="money-note" className="mb-1.5 block text-xs font-medium text-ink-muted">
            Izoh
          </label>
          <input
            id="money-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            disabled={isPending}
            className={financeInputClass}
          />
        </div>

        <FormError message={error} />

        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Bekor qilish
          </Button>
        </div>
      </form>
    </Modal>
  );
}
