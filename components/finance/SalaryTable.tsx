import { PaySalaryButton } from "@/components/finance/FinanceButtons";
import { formatSom } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { SALARY_TYPE_LABELS } from "@/lib/validations/finance";

export interface SalaryRow {
  employee_id: string;
  full_name: string;
  position: string | null;
  kind: string;
  salary_type: string | null;
  rate: number | null;
  lessons: number;
  revenue: number;
  accrued: number;
  paid: number;
  /** Shu oyda berilgan bonuslar yig'indisi (Moliya → Bonus). */
  bonus?: number;
  /** Shu oyda qo'yilgan jarimalar yig'indisi (Moliya → Jarima). */
  fine?: number;
  /** Oxirgi oylik to'lovi sanasi. */
  lastPaidAt?: string | null;
}

const KIND_LABELS: Record<string, string> = {
  teacher: "O'qituvchi",
  manager: "Moderator",
  admin: "Ma'muriyat",
};

const TH = "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase";

/**
 * Oylik jadvali (Edu tizimdagi "Oylik chiqarish" ustunlari): oylik, darslar, bonus, jarima,
 * jami, to'langan, to'lanmagan va oxirgi to'lov sanasi.
 */
export function SalaryTable({ rows, period }: { rows: SalaryRow[]; period: string }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
        Xodimlar ro&apos;yxati bo&apos;sh. Avval Xodimlar bo&apos;limida qo&apos;shing.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-canvas">
          <tr>
            <th className={`${TH} w-12`}>№</th>
            <th className={TH}>To&apos;liq ismi</th>
            <th className={TH}>Maosh turi</th>
            <th className={TH}>Oylik</th>
            <th className={TH}>Darslar</th>
            <th className={TH}>Bonus</th>
            <th className={TH}>Jarima</th>
            <th className={TH}>Jami</th>
            <th className={TH}>To&apos;langan</th>
            <th className={TH}>To&apos;lanmagan</th>
            <th className={TH}>Sana</th>
            <th className={TH}>Amallar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, i) => {
            const bonus = r.bonus ?? 0;
            const fine = r.fine ?? 0;
            const total = r.accrued + bonus - fine;
            const remaining = total - r.paid;
            return (
              <tr key={r.employee_id} className="hover:bg-canvas">
                <td className="px-4 py-3 text-ink-faint">{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{r.full_name}</div>
                  <div className="text-xs text-ink-faint">{r.position || KIND_LABELS[r.kind] || "—"}</div>
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {r.salary_type ? SALARY_TYPE_LABELS[r.salary_type] : "—"}
                </td>
                <td className="px-4 py-3">{formatSom(r.accrued)}</td>
                <td className="px-4 py-3 text-ink-muted">{r.lessons}</td>
                <td className={`px-4 py-3 ${bonus > 0 ? "text-green-600" : "text-ink-faint"}`}>
                  {bonus > 0 ? `+ ${formatSom(bonus)}` : "—"}
                </td>
                <td className={`px-4 py-3 ${fine > 0 ? "text-red-600" : "text-ink-faint"}`}>
                  {fine > 0 ? `− ${formatSom(fine)}` : "—"}
                </td>
                <td className="px-4 py-3 font-medium text-ink">{formatSom(total)}</td>
                <td className="px-4 py-3 text-ink-muted">{formatSom(r.paid)}</td>
                <td className={`px-4 py-3 font-medium ${remaining > 0 ? "text-red-600" : "text-ink-muted"}`}>
                  {formatSom(remaining)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                  {r.lastPaidAt ? formatDate(r.lastPaidAt) : "—"}
                </td>
                <td className="px-4 py-3">
                  <PaySalaryButton
                    employeeId={r.employee_id}
                    employeeName={r.full_name}
                    period={period}
                    due={Math.max(remaining, 0)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
