import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BalanceBadge } from "@/components/payments/BalanceBadge";
import { StudentStatusActions } from "@/components/students/StudentStatusActions";
import { formatDate } from "@/lib/utils/date";
import { formatSom } from "@/lib/utils/currency";
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
  const supabase = await createClient();

  const [{ data: student }, { data: payments }] = await Promise.all([
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
  ]);

  if (!student) notFound();

  const paymentRows = (payments ?? []) as PaymentRow[];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/students"
          className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          aria-label="O'quvchilarga qaytish"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-semibold text-white">{student.full_name}</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="space-y-3 rounded-xl border border-white/10 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Guruh</span>
              <span className="text-white">{student.group?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Telefon</span>
              <span className="text-white">{student.phone || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Balans</span>
              <BalanceBadge balance={student.balance} />
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Qo&apos;shilgan</span>
              <span className="text-white">{formatDate(student.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Telegram</span>
              <span className={student.parent_telegram_chat_id ? "text-green-400" : "text-white/50"}>
                {student.parent_telegram_chat_id ? "Ulangan" : "Ulanmagan"}
              </span>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-white/10 p-4">
            <h2 className="text-xs font-semibold tracking-wide text-white/40 uppercase">
              Holati
            </h2>
            <StudentStatusActions studentId={studentId} status={student.status} />
          </div>
        </div>

        <div className="space-y-2 lg:col-span-2">
          <h2 className="text-sm font-semibold text-white/70">To&apos;lovlar tarixi</h2>
          {paymentRows.length === 0 ? (
            <div className="rounded-xl border border-white/10 p-8 text-center text-white/50">
              Hali to&apos;lov qilinmagan.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/60">
                  <tr>
                    <th className="px-4 py-3 font-medium">Sana</th>
                    <th className="px-4 py-3 font-medium">Summa</th>
                    <th className="px-4 py-3 font-medium">Usul</th>
                    <th className="px-4 py-3 font-medium">Izoh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {paymentRows.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-white/70">{formatDate(p.paid_at)}</td>
                      <td className="px-4 py-3 text-white">{formatSom(p.amount)}</td>
                      <td className="px-4 py-3 text-white/70">
                        {METHOD_LABELS[p.method] ?? p.method}
                      </td>
                      <td className="px-4 py-3 text-white/70">{p.note || "—"}</td>
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
