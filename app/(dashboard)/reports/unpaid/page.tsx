import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { ReportCards, ReportTable } from "@/components/reports/ReportParts";
import { formatSom } from "@/lib/utils/currency";

interface Row {
  id: string;
  full_name: string;
  phone: string | null;
  balance: number;
  group: { name: string; monthly_price: number; schedule_days: string[] | null } | null;
}

/** O'quvchining umumiy to'lanmagan summasi: balansi manfiy (qarzdor) aktiv o'quvchilar. */
export default async function UnpaidReportPage() {
  const { supabase } = await requirePermission("finance.reports");

  const { data } = await supabase
    .from("students")
    .select("id, full_name, phone, balance, group:groups(name, monthly_price, schedule_days)")
    .eq("status", "active")
    .lt("balance", 0)
    .order("balance");

  const rows = (data ?? []) as unknown as Row[];
  const total = rows.reduce((s, r) => s - Number(r.balance), 0);

  return (
    <div className="space-y-4">
      <ReportCards
        items={[
          { label: "Qarzdor o'quvchilar", value: rows.length, tone: rows.length > 0 ? "bad" : "default" },
          { label: "Jami to'lanmagan summa", value: formatSom(total), tone: total > 0 ? "bad" : "default" },
          { label: "O'rtacha qarz", value: rows.length ? formatSom(Math.round(total / rows.length)) : "—" },
        ]}
      />
      <ReportTable
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          {
            header: "Ism",
            cell: (r) => (
              <Link href={`/education/students/${r.id}`} className="font-medium text-ink hover:text-brand-600">
                {r.full_name}
              </Link>
            ),
          },
          { header: "Guruhlar", cell: (r) => r.group?.name ?? "—" },
          {
            header: "To'lanmagan darslar",
            align: "right",
            cell: (r) => {
              // Bir darsning narxi = oylik narx / oydagi darslar soni (haftada n kun x 4).
              const perMonth = (r.group?.schedule_days?.length ?? 0) * 4;
              const price = Number(r.group?.monthly_price ?? 0);
              return perMonth > 0 && price > 0 ? Math.ceil(-Number(r.balance) / (price / perMonth)) : "—";
            },
          },
          {
            header: "Jami to'lanmagan",
            align: "right",
            cell: (r) => <span className="font-medium text-red-600">{formatSom(-Number(r.balance))}</span>,
          },
        ]}
      />
    </div>
  );
}
