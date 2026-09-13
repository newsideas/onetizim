import Link from "next/link";
import { BalanceBadge } from "@/components/payments/BalanceBadge";
import { StudentStatusBadge } from "@/components/students/StudentStatusBadge";
import type { Student } from "@/types/database";

export type StudentTableRow = Student & { group: { name: string } | null };

export function StudentsTable({
  students,
  showStatus = true,
  emptyText = "Hali o'quvchilar yo'q.",
}: {
  students: StudentTableRow[];
  showStatus?: boolean;
  emptyText?: string;
}) {
  if (students.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 p-8 text-center text-white/50">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-white/60">
          <tr>
            <th className="px-4 py-3 font-medium">Ism familiyasi</th>
            <th className="px-4 py-3 font-medium">Guruh</th>
            <th className="px-4 py-3 font-medium">Telefon</th>
            <th className="px-4 py-3 font-medium">Balans</th>
            {showStatus && <th className="px-4 py-3 font-medium">Holati</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-white/5">
              <td className="px-4 py-3">
                <Link
                  href={`/students/${student.id}`}
                  className="font-medium text-white hover:text-blue-400"
                >
                  {student.full_name}
                </Link>
              </td>
              <td className="px-4 py-3 text-white/70">{student.group?.name || "—"}</td>
              <td className="px-4 py-3 text-white/70">{student.phone || "—"}</td>
              <td className="px-4 py-3">
                <BalanceBadge balance={student.balance} />
              </td>
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
