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
      <h2 className="text-sm font-semibold text-white/70">
        Qarzdorlar ({debtors.length})
      </h2>
      <div className="overflow-x-auto rounded-xl border border-red-500/25 bg-red-500/5">
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-white/10">
            {debtors.map((d) => (
              <tr key={d.id} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  <Link
                    href={`/students/${d.id}`}
                    className="font-medium text-white hover:text-blue-400"
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
