"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { unwrap } from "@/lib/actions/result";
import { createPayment } from "@/lib/actions/payments";
import { todayIso } from "@/lib/utils/date";
import { METHOD_LABELS, PAYMENT_WINDOW_METHODS } from "@/lib/validations/payment";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { Select } from "@/components/ui/Select";

export interface StudentOption {
  id: string;
  full_name: string;
}

/**
 * Edu tizimdagi "Kirim" paneli: tranzaksiya turi (o'quvchi to'ladi), o'quvchi, qiymat,
 * to'lov turi (Naqd / Plastik / Terminal), sana va izoh.
 */
export function PaymentForm({
  students,
  onSuccess,
  cashboxId,
}: {
  students: StudentOption[];
  onSuccess: () => void;
  /** To'lov tushadigan kassa; berilmasa asosiy kassa. */
  cashboxId?: string;
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [paidAt, setPaidAt] = useState(todayIso());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!studentId) return setError("O'quvchini tanlang");
    if (!amount || Number(amount) <= 0) return setError("Summani kiriting");
    if (!method) return setError("To'lov turini tanlang");

    setSaving(true);
    try {
      unwrap(
        await createPayment({
          studentId,
          amount: Number(amount),
          method: method as (typeof PAYMENT_WINDOW_METHODS)[number],
          paidAt,
          note,
          cashboxId,
        }),
      );
      router.refresh();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div>
        <Label htmlFor="pay-type">Tranzaksiya</Label>
        <Select id="pay-type" value="student" disabled onChange={() => {}}>
          <option value="student">O&apos;quvchi to&apos;ladi</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="pay-student">O&apos;quvchini tanlang</Label>
        <SearchSelect
          id="pay-student"
          value={studentId}
          onChange={setStudentId}
          options={students.map((s) => ({ value: s.id, label: s.full_name }))}
          placeholder="Tanlang"
          disabled={saving}
        />
      </div>

      <div>
        <Label htmlFor="pay-amount">Qiymat</Label>
        <Input
          id="pay-amount"
          type="number"
          min={0}
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={saving}
        />
      </div>

      <div>
        <Label htmlFor="pay-method">To&apos;lov turi</Label>
        <Select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)} disabled={saving}>
          <option value="">Tanlang</option>
          {PAYMENT_WINDOW_METHODS.map((m) => (
            <option key={m} value={m}>
              {METHOD_LABELS[m]}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="pay-date">Sanani tanlang</Label>
        <Input id="pay-date" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} disabled={saving} />
      </div>

      <div>
        <Label htmlFor="pay-note">Izoh</Label>
        <Input id="pay-note" value={note} onChange={(e) => setNote(e.target.value)} disabled={saving} />
      </div>

      <FormError message={error} />

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onSuccess} disabled={saving}>
          Orqaga
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </form>
  );
}
