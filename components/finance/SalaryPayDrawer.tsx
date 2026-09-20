"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSalaryPayout } from "@/lib/actions/finance";
import { unwrap } from "@/lib/actions/result";
import { formatSom } from "@/lib/utils/currency";
import { formatMonth, todayIso } from "@/lib/utils/date";
import { METHOD_LABELS, PAYMENT_WINDOW_METHODS } from "@/lib/validations/payment";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";

/**
 * Xodimga oylik to'lash paneli (Edu tizimdagidek ko'k sarlavha): xodim va oy, qiymat,
 * to'lov turi, sana va izoh.
 */
export function SalaryPayDrawer({
  open,
  onClose,
  employeeId,
  employeeName,
  period,
  due,
}: {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  period: string;
  due: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(due > 0 ? String(due) : "");
  const [method, setMethod] = useState("");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!amount || Number(amount) <= 0) return setError("Summani kiriting");
    if (!method) return setError("To'lov turini tanlang");

    setSaving(true);
    try {
      unwrap(
        await createSalaryPayout({
          employeeId,
          period,
          amount: Number(amount),
          method: method as (typeof PAYMENT_WINDOW_METHODS)[number],
          paidAt: date,
          note,
        }),
      );
      router.refresh();
      setSaving(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
      setSaving(false);
    }
  }

  return (
    <Drawer open={open} onClose={onClose} title="Oylik chiqarish" tone="brand">
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div className="rounded-lg bg-canvas px-3 py-2.5 text-sm">
          <div className="font-medium text-ink">{employeeName}</div>
          <div className="text-ink-muted">
            {formatMonth(period)} · to&apos;lanmagan {formatSom(due)}
          </div>
        </div>

        <div>
          <Label htmlFor="sal-amount">Qiymat</Label>
          <Input
            id="sal-amount"
            type="number"
            min={0}
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={saving}
          />
        </div>
        <div>
          <Label htmlFor="sal-method">To&apos;lov turi</Label>
          <Select id="sal-method" value={method} onChange={(e) => setMethod(e.target.value)} disabled={saving}>
            <option value="">Tanlang</option>
            {PAYMENT_WINDOW_METHODS.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABELS[m]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="sal-date">Sanani tanlang</Label>
          <Input id="sal-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={saving} />
        </div>
        <div>
          <Label htmlFor="sal-note">Izoh</Label>
          <Input id="sal-note" value={note} onChange={(e) => setNote(e.target.value)} disabled={saving} />
        </div>

        <FormError message={error} />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
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
