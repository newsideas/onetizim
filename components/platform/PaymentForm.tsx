"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { recordPlatformPayment } from "@/lib/actions/platform";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";

/** Markazdan olingan to'lovni yozadi; obuna tanlangan oylarga uzayadi. */
export function PaymentForm({ orgId, today }: { orgId: string; today: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState("1");
  const [method, setMethod] = useState("Naqd");
  const [paidAt, setPaidAt] = useState(today);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSaved(false);
    startTransition(async () => {
      const result = await recordPlatformPayment(orgId, {
        amount: Number(amount),
        months: Number(months),
        method: method as "Naqd" | "Karta" | "Bank o'tkazmasi",
        note,
        paidAt,
      });
      if (!result.ok) return setError(result.error);
      setAmount("");
      setNote("");
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="pay-amount">Summa (so&apos;m)</Label>
          <Input
            id="pay-amount"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="pay-months">Necha oyga (1 oy = 30 kun)</Label>
          <Input id="pay-months" type="number" min={1} max={36} value={months} onChange={(e) => setMonths(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="pay-method">To&apos;lov turi</Label>
          <Select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option>Naqd</option>
            <option>Karta</option>
            <option>Bank o&apos;tkazmasi</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="pay-date">Sana</Label>
          <Input id="pay-date" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="pay-note">Izoh</Label>
        <Input id="pay-note" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <FormError message={error} />
      {saved && <p className="text-sm text-emerald-600 dark:text-emerald-400">To&apos;lov yozildi, obuna uzaytirildi</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saqlanmoqda..." : "To'lovni yozish"}
      </Button>
    </form>
  );
}
