"use client";

import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { deleteExpense } from "@/lib/actions/finance";
import { formatDate } from "@/lib/utils/date";
import { formatSom } from "@/lib/utils/currency";
import { METHOD_LABELS } from "@/lib/validations/payment";
import type { PaymentMethod } from "@/types/database";

export interface ExpenseRow {
  id: string;
  amount: number;
  category: string;
  method: PaymentMethod;
  spent_at: string;
  note: string | null;
}

export function ExpensesList({ expenses }: { expenses: ExpenseRow[] }) {
  if (expenses.length === 0) {
    return (
      <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
        Hali xarajat kiritilmagan.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-canvas text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Sana</th>
            <th className="px-4 py-3 font-medium">Turi</th>
            <th className="px-4 py-3 font-medium">Summa</th>
            <th className="px-4 py-3 font-medium">Usul</th>
            <th className="px-4 py-3 font-medium">Izoh</th>
            <th className="px-4 py-3 font-medium">Amallar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {expenses.map((e) => (
            <tr key={e.id} className="hover:bg-canvas">
              <td className="px-4 py-3 text-ink-muted">{formatDate(e.spent_at)}</td>
              <td className="px-4 py-3 text-ink">{e.category}</td>
              <td className="px-4 py-3 font-medium text-red-600">− {formatSom(e.amount)}</td>
              <td className="px-4 py-3 text-ink-muted">{METHOD_LABELS[e.method]}</td>
              <td className="px-4 py-3 text-ink-muted">{e.note || "—"}</td>
              <td className="px-4 py-3">
                <ConfirmActionButton
                  action={() => deleteExpense(e.id)}
                  confirmText={`"${e.category}" (${formatSom(e.amount)}) xarajatini o'chirmoqchimisiz?`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
