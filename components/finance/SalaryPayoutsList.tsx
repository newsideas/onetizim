import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { deleteSalaryPayout } from "@/lib/actions/finance";
import { formatDate } from "@/lib/utils/date";
import { formatSom } from "@/lib/utils/currency";
import { METHOD_LABELS } from "@/lib/validations/payment";
import type { PaymentMethod } from "@/types/database";

export interface SalaryPayoutRow {
  id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
  note: string | null;
  employee: { full_name: string } | null;
}

export function SalaryPayoutsList({ payouts }: { payouts: SalaryPayoutRow[] }) {
  if (payouts.length === 0) {
    return (
      <div className="rounded-xl border border-line p-6 text-center text-sm text-ink-faint">
        Bu oy uchun hali to&apos;lov qilinmagan.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-canvas text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Xodim</th>
            <th className="px-4 py-3 font-medium">Summa</th>
            <th className="px-4 py-3 font-medium">Usul</th>
            <th className="px-4 py-3 font-medium">Sana</th>
            <th className="px-4 py-3 font-medium">Izoh</th>
            <th className="px-4 py-3 font-medium">Amallar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {payouts.map((p) => (
            <tr key={p.id} className="hover:bg-canvas">
              <td className="px-4 py-3 font-medium text-ink">{p.employee?.full_name ?? "—"}</td>
              <td className="px-4 py-3">{formatSom(p.amount)}</td>
              <td className="px-4 py-3 text-ink-muted">{METHOD_LABELS[p.method]}</td>
              <td className="px-4 py-3 text-ink-muted">{formatDate(p.paid_at)}</td>
              <td className="px-4 py-3 text-ink-muted">{p.note || "—"}</td>
              <td className="px-4 py-3">
                <ConfirmActionButton
                  action={() => deleteSalaryPayout(p.id)}
                  confirmText={`${p.employee?.full_name ?? "Xodim"}ga qilingan ${formatSom(p.amount)} to'lovni bekor qilmoqchimisiz?`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
