import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BalanceBadge } from "@/components/payments/BalanceBadge";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("*, group:groups(name)")
    .eq("id", studentId)
    .maybeSingle();

  if (!student) notFound();

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold text-white">{student.full_name}</h1>

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
      </div>

      {/* TODO: 8-bosqich — to'lovlar tarixi shu yerga qo'shiladi. */}
    </div>
  );
}
