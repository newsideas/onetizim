import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { BalanceBadge } from "@/components/payments/BalanceBadge";
import { StudentStatusActions } from "@/components/students/StudentStatusActions";
import { formatDate } from "@/lib/utils/date";
import { formatSom } from "@/lib/utils/currency";
import { averageScore } from "@/lib/validations/grade";
import { METHOD_LABELS } from "@/lib/validations/payment";
import type { PaymentMethod } from "@/types/database";

interface PaymentRow {
  id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
  note: string | null;
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const { supabase } = await requirePermission("students.view");

  const [{ data: student }, { data: payments }, { data: attendance }, { data: grades }] =
    await Promise.all([
    supabase
      .from("students")
      .select("*, group:groups(name)")
      .eq("id", studentId)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("id, amount, method, paid_at, note")
      .eq("student_id", studentId)
      .order("paid_at", { ascending: false }),
    supabase.from("attendance").select("status").eq("student_id", studentId),
    supabase.from("grades").select("subject, score").eq("student_id", studentId),
  ]);

  if (!student) notFound();

  const paymentRows = (payments ?? []) as PaymentRow[];

  const lessonsTotal = attendance?.length ?? 0;
  const attended = (attendance ?? []).filter((a) => a.status !== "absent").length;
  const attendancePercent = lessonsTotal > 0 ? Math.round((attended / lessonsTotal) * 100) : null;

  const scoresBySubject = new Map<string, number[]>();
  for (const g of grades ?? []) {
    const list = scoresBySubject.get(g.subject as string) ?? [];
    list.push(g.score as number);
    scoresBySubject.set(g.subject as string, list);
  }
  const overallAverage = averageScore((grades ?? []).map((g) => g.score as number));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/education/students"
          className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-canvas hover:text-ink"
          aria-label="O'quvchilarga qaytish"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-semibold text-ink">{student.full_name}</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="space-y-3 rounded-xl border border-line p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-faint">Guruh</span>
              <span className="text-ink">{student.group?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-faint">Telefon</span>
              <span className="text-ink">{student.phone || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-faint">Balans</span>
              <BalanceBadge balance={student.balance} />
            </div>
            <div className="flex justify-between">
              <span className="text-ink-faint">Qo&apos;shilgan</span>
              <span className="text-ink">{formatDate(student.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-faint">Telegram</span>
              <span className={student.parent_telegram_chat_id ? "text-green-400" : "text-ink-faint"}>
                {student.parent_telegram_chat_id ? "Ulangan" : "Ulanmagan"}
              </span>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-line p-4 text-sm">
            <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
              O&apos;quv natijasi
            </h2>
            <div className="flex justify-between">
              <span className="text-ink-faint">Davomat</span>
              <span className="text-ink">
                {attendancePercent === null
                  ? "—"
                  : `${attendancePercent}% (${attended}/${lessonsTotal})`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-faint">O&apos;rtacha baho</span>
              <span className="font-semibold text-ink">{overallAverage ?? "—"}</span>
            </div>
            {[...scoresBySubject.entries()].map(([subject, scores]) => (
              <div key={subject} className="flex justify-between">
                <span className="text-ink-faint">{subject}</span>
                <span className="text-ink">{averageScore(scores)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 rounded-xl border border-line p-4">
            <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">
              Holati
            </h2>
            <StudentStatusActions studentId={studentId} status={student.status} />
          </div>
        </div>

        <div className="space-y-2 lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink-muted">To&apos;lovlar tarixi</h2>
          {paymentRows.length === 0 ? (
            <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
              Hali to&apos;lov qilinmagan.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-canvas text-ink-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Sana</th>
                    <th className="px-4 py-3 font-medium">Summa</th>
                    <th className="px-4 py-3 font-medium">Usul</th>
                    <th className="px-4 py-3 font-medium">Izoh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {paymentRows.map((p) => (
                    <tr key={p.id} className="hover:bg-canvas">
                      <td className="px-4 py-3 text-ink-muted">{formatDate(p.paid_at)}</td>
                      <td className="px-4 py-3 text-ink">{formatSom(p.amount)}</td>
                      <td className="px-4 py-3 text-ink-muted">
                        {METHOD_LABELS[p.method] ?? p.method}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{p.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
