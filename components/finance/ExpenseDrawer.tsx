"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createExpense, getExpenseTypes } from "@/lib/actions/finance";
import { unwrap } from "@/lib/actions/result";
import { todayIso } from "@/lib/utils/date";
import { EXPENSE_CATEGORIES } from "@/lib/validations/finance";
import { METHOD_LABELS, PAYMENT_WINDOW_METHODS } from "@/lib/validations/payment";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";

/**
 * Edu tizimdagi kassa "Chiqim" paneli: tranzaksiya turi (Moliya → Tranzaksiya turi ro'yxatidan),
 * qiymat, to'lov turi, sana va izoh.
 */
export function ExpenseDrawer({
  open,
  onClose,
  cashboxId,
}: {
  open: boolean;
  onClose: () => void;
  /** Chiqim yoziladigan kassa; berilmasa asosiy kassa. */
  cashboxId?: string;
}) {
  const router = useRouter();
  const [types, setTypes] = useState<string[] | null>(null);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  // Tranzaksiya turlari panel birinchi ochilganda yuklanadi; ro'yxat bo'sh bo'lsa, tayyor xarajat turlari ko'rsatiladi.
  useEffect(() => {
    if (!open || types) return;
    getExpenseTypes()
      .then((result) => {
        const names = unwrap(result);
        setTypes(names.length > 0 ? names : [...EXPENSE_CATEGORIES]);
      })
      .catch(() => setTypes([...EXPENSE_CATEGORIES]));
  }, [open, types]);

  function close() {
    setCategory("");
    setAmount("");
    setMethod("");
    setDate(todayIso());
    setNote("");
    setError(undefined);
    setSaving(false);
    onClose();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!category) return setError("Tranzaksiya turini tanlang");
    if (!amount || Number(amount) <= 0) return setError("Summani kiriting");
    if (!method) return setError("To'lov turini tanlang");

    setSaving(true);
    try {
      unwrap(
        await createExpense({
          amount: Number(amount),
          category,
          method: method as (typeof PAYMENT_WINDOW_METHODS)[number],
          spentAt: date,
          note,
          cashboxId,
        }),
      );
      router.refresh();
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
      setSaving(false);
    }
  }

  return (
    <Drawer open={open} onClose={close} title="Chiqim" tone="brand">
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div>
          <Label htmlFor="exp-type">Tranzaksiya</Label>
          <Select id="exp-type" value={category} onChange={(e) => setCategory(e.target.value)} disabled={saving}>
            <option value="">Tanlang</option>
            {(types ?? []).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="exp-amount">Qiymat</Label>
          <Input
            id="exp-amount"
            type="number"
            min={0}
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={saving}
          />
        </div>
        <div>
          <Label htmlFor="exp-method">To&apos;lov turi</Label>
          <Select id="exp-method" value={method} onChange={(e) => setMethod(e.target.value)} disabled={saving}>
            <option value="">Tanlang</option>
            {PAYMENT_WINDOW_METHODS.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABELS[m]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="exp-date">Sanani tanlang</Label>
          <Input id="exp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={saving} />
        </div>
        <div>
          <Label htmlFor="exp-note">Izoh</Label>
          <Input id="exp-note" value={note} onChange={(e) => setNote(e.target.value)} disabled={saving} />
        </div>

        <FormError message={error} />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={close} disabled={saving}>
            Orqaga
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
