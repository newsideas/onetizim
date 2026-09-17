"use client";

import { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MoneyEntryModal, financeInputClass } from "@/components/finance/MoneyEntryModal";
import { createExpense, createSalaryPayout } from "@/lib/actions/finance";
import { formatSom } from "@/lib/utils/currency";
import { formatMonth } from "@/lib/utils/date";
import { EXPENSE_CATEGORIES } from "@/lib/validations/finance";

export function NewExpenseButton() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");

  return (
    <>
      <Button onClick={() => setOpen(true)} className="inline-flex items-center gap-2">
        <Plus size={16} aria-hidden="true" /> Xarajat qo&apos;shish
      </Button>

      {open && (
        <MoneyEntryModal
          title="Yangi xarajat"
          dateLabel="Xarajat sanasi"
          onClose={() => {
            setOpen(false);
            setCategory("");
          }}
          onSubmit={(v) =>
            category.trim().length < 2
              ? "Xarajat turini kiriting"
              : createExpense({
                  amount: v.amount,
                  category,
                  method: v.method,
                  spentAt: v.date,
                  note: v.note,
                })
          }
        >
          <div>
            <label htmlFor="expense-category" className="mb-1.5 block text-xs font-medium text-ink-muted">
              Xarajat turi <span className="text-red-500">*</span>
            </label>
            <input
              id="expense-category"
              list="expense-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={80}
              autoFocus
              className={financeInputClass}
            />
            <datalist id="expense-categories">
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </MoneyEntryModal>
      )}
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
        <MoneyEntryModal
          title="Oylik to'lash"
          dateLabel="To'langan sana"
          defaultAmount={due > 0 ? due : undefined}
          onClose={() => setOpen(false)}
          onSubmit={(v) =>
            createSalaryPayout({
              employeeId,
              period,
              amount: v.amount,
              method: v.method,
              paidAt: v.date,
              note: v.note,
            })
          }
        >
          <div className="rounded-lg bg-canvas px-3 py-2.5 text-sm">
            <div className="font-medium text-ink">{employeeName}</div>
            <div className="text-ink-muted">
              {formatMonth(period)} · qoldiq {formatSom(due)}
            </div>
          </div>
        </MoneyEntryModal>
      )}
    </>
  );
}
