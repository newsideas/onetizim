"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { PaymentForm, type StudentOption } from "@/components/payments/PaymentForm";

/** Edu tizimdagi kassa "Kirim" tugmasi: o'quvchi to'lovini kiritish paneli. */
export function NewPaymentButton({
  students,
  label = "Kirim",
  cashboxId,
  className,
}: {
  students: StudentOption[];
  label?: string;
  /** To'lov tushadigan kassa; berilmasa asosiy kassa. */
  cashboxId?: string;
  /** Berilsa, tugma standart ko'rinish o'rniga shu klasslar bilan chiziladi (kassa kartasidagi tugma). */
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {className ? (
        <button type="button" onClick={() => setOpen(true)} className={className}>
          <Plus size={14} /> {label}
        </button>
      ) : (
        <Button onClick={() => setOpen(true)} className="inline-flex items-center gap-2">
          <Plus size={16} /> {label}
        </Button>
      )}

      <Drawer open={open} onClose={() => setOpen(false)} title="Kirim" tone="brand">
        {students.length === 0 ? (
          <p className="text-sm text-ink-muted">Avval kamida bitta o&apos;quvchi qo&apos;shing.</p>
        ) : (
          <PaymentForm students={students} cashboxId={cashboxId} onSuccess={() => setOpen(false)} />
        )}
      </Drawer>
    </>
  );
}
