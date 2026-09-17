import { PaySalaryButton } from "@/components/finance/FinanceButtons";
import { formatSom } from "@/lib/utils/currency";
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
}

const KIND_LABELS: Record<string, string> = {
  teacher: "O'qituvchi",
  manager: "Menejer",
  admin: "Ma'muriyat",
};

export function SalaryTable({ rows, period }: { rows: SalaryRow[]; period: string }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
        Xodimlar ro&apos;yxati bo&apos;sh. Avval Xodimlar bo&apos;limida qo&apos;shing.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-canvas text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-medium">FISH</th>
            <th className="px-4 py-3 font-medium">Lavozim</th>
            <th className="px-4 py-3 font-medium">Maosh turi</th>
            <th className="px-4 py-3 font-medium">Hisoblangan</th>
            <th className="px-4 py-3 font-medium">To&apos;langan</th>
            <th className="px-4 py-3 font-medium">Qoldiq</th>
            <th className="px-4 py-3 font-medium">Amallar</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => {
            const remaining = r.accrued - r.paid;
            return (
              <tr key={r.employee_id} className="hover:bg-canvas">
                <td className="px-4 py-3 font-medium text-ink">{r.full_name}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {r.position || KIND_LABELS[r.kind] || "—"}
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {r.salary_type ? SALARY_TYPE_LABELS[r.salary_type] : "—"}
                  {r.salary_type === "per_lesson" && (
                    <span className="ml-1 text-xs text-ink-faint">({r.lessons} dars)</span>
                  )}
                </td>
                <td className="px-4 py-3">{formatSom(r.accrued)}</td>
                <td className="px-4 py-3 text-ink-muted">{formatSom(r.paid)}</td>
                <td
                  className={`px-4 py-3 font-medium ${remaining > 0 ? "text-red-600" : "text-ink-muted"}`}
                >
                  {formatSom(remaining)}
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
