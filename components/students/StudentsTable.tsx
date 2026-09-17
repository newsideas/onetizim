import Link from "next/link";
import { BalanceBadge } from "@/components/payments/BalanceBadge";
import { StudentStatusBadge } from "@/components/students/StudentStatusBadge";
import type { Student } from "@/types/database";

export type StudentTableRow = Student & { group: { name: string } | null };

export function StudentsTable({
  students,
  showStatus = true,
  emptyText = "Hali o'quvchilar yo'q.",
  groupLabel = "Guruh",
  linkToProfile = true,
  showBalance = true,
}: {
  students: StudentTableRow[];
  showStatus?: boolean;
  emptyText?: string;
  /** Muassasa turiga qarab "Sinf" yoki "Guruh". */
  groupLabel?: string;
  /** O'qituvchi o'quvchi kartasini ochmaydi va balansni ko'rmaydi. */
  linkToProfile?: boolean;
  showBalance?: boolean;
}) {
  if (students.length === 0) {
    return (
      <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-canvas text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Ism familiyasi</th>
            <th className="px-4 py-3 font-medium">{groupLabel}</th>
            <th className="px-4 py-3 font-medium">Telefon</th>
            {showBalance && <th className="px-4 py-3 font-medium">Balans</th>}
            {showStatus && <th className="px-4 py-3 font-medium">Holati</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-canvas">
              <td className="px-4 py-3">
                {linkToProfile ? (
                  <Link
                    href={`/education/students/${student.id}`}
                    className="font-medium text-ink hover:text-brand-600"
                  >
                    {student.full_name}
                  </Link>
                ) : (
                  <span className="font-medium text-ink">{student.full_name}</span>
                )}
              </td>
              <td className="px-4 py-3 text-ink-muted">{student.group?.name || "—"}</td>
              <td className="px-4 py-3 text-ink-muted">{student.phone || "—"}</td>
              {showBalance && (
                <td className="px-4 py-3">
                  <BalanceBadge balance={student.balance} />
                </td>
              )}
              {showStatus && (
                <td className="px-4 py-3">
                  <StudentStatusBadge status={student.status} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
