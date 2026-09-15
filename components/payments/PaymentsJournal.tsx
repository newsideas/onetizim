import { formatDate } from "@/lib/utils/date";
import { formatSom } from "@/lib/utils/currency";
import { METHOD_LABELS } from "@/lib/validations/payment";
import type { PaymentMethod } from "@/types/database";

export interface PaymentJournalRow {
  id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
  note: string | null;
  student: { full_name: string } | null;
}

export function PaymentsJournal({ payments }: { payments: PaymentJournalRow[] }) {
  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
        Hali to&apos;lovlar yo&apos;q. &quot;Yangi to&apos;lov&quot; tugmasi orqali
        kiriting.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-canvas text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-medium">O&apos;quvchi</th>
            <th className="px-4 py-3 font-medium">Summa</th>
            <th className="px-4 py-3 font-medium">Usul</th>
            <th className="px-4 py-3 font-medium">Sana</th>
            <th className="px-4 py-3 font-medium">Izoh</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {payments.map((p) => (
            <tr key={p.id} className="hover:bg-canvas">
              <td className="px-4 py-3 text-ink">{p.student?.full_name || "—"}</td>
              <td className="px-4 py-3 text-ink-muted">{formatSom(p.amount)}</td>
              <td className="px-4 py-3 text-ink-muted">
                {METHOD_LABELS[p.method] ?? p.method}
              </td>
              <td className="px-4 py-3 text-ink-muted">{formatDate(p.paid_at)}</td>
              <td className="px-4 py-3 text-ink-muted">{p.note || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
