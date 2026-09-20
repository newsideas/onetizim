"use client";

import { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ExpenseDrawer } from "@/components/finance/ExpenseDrawer";
import { SalaryPayDrawer } from "@/components/finance/SalaryPayDrawer";

export function NewExpenseButton({
  cashboxId,
  className,
}: {
  /** Xarajat yoziladigan kassa; berilmasa asosiy kassa. */
  cashboxId?: string;
  /** Berilsa, tugma standart ko'rinish o'rniga shu klasslar bilan chiziladi (kassa kartasidagi tugma). */
  className?: string;
} = {}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {className ? (
        <button type="button" onClick={() => setOpen(true)} className={className}>
          <Plus size={14} aria-hidden="true" /> Chiqim
        </button>
      ) : (
        <Button onClick={() => setOpen(true)} className="inline-flex items-center gap-2">
          <Plus size={16} aria-hidden="true" /> Chiqim
        </Button>
      )}

      <ExpenseDrawer open={open} onClose={() => setOpen(false)} cashboxId={cashboxId} />
    </>
  );
}

export function PaySalaryButton({
  employeeId,
  employeeName,
  period,
  due,
}: {
  employeeId: string;
  employeeName: string;
  period: string;
  due: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
      >
        <Wallet size={13} aria-hidden="true" />
        To&apos;lash
      </button>

      {open && (
        <SalaryPayDrawer
          open
          onClose={() => setOpen(false)}
          employeeId={employeeId}
          employeeName={employeeName}
          period={period}
          due={due}
        />
      )}
    </>
  );
}
