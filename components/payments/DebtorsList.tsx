import Link from "next/link";
import { BalanceBadge } from "@/components/payments/BalanceBadge";

export interface Debtor {
  id: string;
  full_name: string;
  balance: number;
}

export function DebtorsList({ debtors }: { debtors: Debtor[] }) {
  if (debtors.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-ink-muted">
        Qarzdorlar ({debtors.length})
      </h2>
      <div className="overflow-x-auto rounded-xl border border-red-500/25 bg-red-500/5">
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-line">
            {debtors.map((d) => (
              <tr key={d.id} className="hover:bg-canvas">
                <td className="px-4 py-3">
                  <Link
                    href={`/students/${d.id}`}
                    className="font-medium text-ink hover:text-brand-600"
                  >
                    {d.full_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">
                  <BalanceBadge balance={d.balance} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
