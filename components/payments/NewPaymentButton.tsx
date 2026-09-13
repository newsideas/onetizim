"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PaymentForm, type StudentOption } from "@/components/payments/PaymentForm";

export function NewPaymentButton({ students }: { students: StudentOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="inline-flex items-center gap-2">
        <Plus size={16} /> Yangi to&apos;lov
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Yangi to'lov kiritish">
        {students.length === 0 ? (
          <p className="text-sm text-white/60">
            Avval kamida bitta o&apos;quvchi qo&apos;shing.
          </p>
        ) : (
          <PaymentForm students={students} onSuccess={() => setOpen(false)} />
        )}
      </Modal>
    </>
  );
}
