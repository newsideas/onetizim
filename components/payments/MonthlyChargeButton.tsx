"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";
import { chargeMonthlyFees } from "@/lib/actions/charges";

function currentMonth() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

export function MonthlyChargeButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(currentMonth());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);

  async function handleCharge() {
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const count = await chargeMonthlyFees(`${month}-01`);
      setResult(count);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setPending(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setResult(null);
    setError(null);
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2"
      >
        <CalendarClock size={16} /> Oylik hisobni yopish
      </Button>

      <Modal open={open} onClose={handleClose} title="Oylik hisobni yopish">
        <div className="space-y-4">
          <p className="text-sm text-white/60">
            Tanlangan oy uchun barcha aktiv o&apos;quvchilarning balansidan
            guruhining oylik narxi ayiriladi. Allaqachon hisoblangan
            o&apos;quvchilar ikkinchi marta hisoblanmaydi.
          </p>

          <div>
            <Label htmlFor="charge-month">Oy</Label>
            <Input
              id="charge-month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>

          {result !== null && (
            <p className="text-sm text-green-400">
              {result === 0
                ? "Bu oy uchun hamma hisoblangan edi — yangi yozuv qo'shilmadi."
                : `${result} ta o'quvchiga hisob yozildi.`}
            </p>
          )}

          <FormError message={error ?? undefined} />

          <div className="flex gap-2">
            <Button onClick={handleCharge} disabled={pending} className="flex-1">
              {pending ? "Hisoblanmoqda..." : "Hisobni yopish"}
            </Button>
            <Button variant="secondary" onClick={handleClose} disabled={pending}>
              Yopish
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
