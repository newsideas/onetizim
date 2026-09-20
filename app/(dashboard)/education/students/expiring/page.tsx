import Link from "next/link";
import { Inbox } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { BalanceBadge } from "@/components/payments/BalanceBadge";
import { InlineFilters, TablePager, type InlineField } from "@/components/ui/ListToolbar";
import { readPaging } from "@/lib/paging";
import { termsFor } from "@/lib/segment";
import { formatSom } from "@/lib/utils/currency";

const TH = "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase";

interface Row {
  id: string;
  full_name: string;
  phone: string | null;
  balance: number;
  group: { name: string; monthly_price: number } | null;
}

/**
 * Joriy oyda obunasi tugaydiganlar: keyingi oylik to'lov yozilganda balansi
 * yetmaydigan aktiv o'quvchilar. Kutilayotgan balans = joriy balans − guruhning oylik narxi.
 */
export default async function ExpiringStudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, org } = await requirePermission("students.view");
  const terms = termsFor(org.type);

  const { data } = await supabase
    .from("students")
    .select("id, full_name, phone, balance, group:groups(name, monthly_price)")
    .eq("status", "active")
    .not("group_id", "is", null)
    .order("full_name");

  const q = params.q?.trim().toLowerCase();
  // Holat berilmasa faqat obunasi tugaydiganlar; "all" — hammasi.
  const state = params.state ?? "expiring";

  const rows = ((data ?? []) as unknown as Row[])
    .map((s) => {
      const price = Number(s.group?.monthly_price ?? 0);
      return { ...s, price, expected: Number(s.balance) - price };
    })
    .filter((s) => {
      if (q && !`${s.full_name} ${s.phone ?? ""}`.toLowerCase().includes(q)) return false;
      if (state === "expiring") return s.price > 0 && s.expected < 0;
      if (state === "covered") return s.expected >= 0;
      return true;
    });

  const total = {
    price: rows.reduce((sum, s) => sum + s.price, 0),
    balance: rows.reduce((sum, s) => sum + Number(s.balance), 0),
    expected: rows.reduce((sum, s) => sum + s.expected, 0),
  };

  const { page, size } = readPaging(params);
  const current = Math.min(page, Math.max(1, Math.ceil(rows.length / size)));
  const offset = (current - 1) * size;
  const visible = rows.slice(offset, offset + size);

  const fields: InlineField[] = [
    { name: "q", label: "Qidiruv", type: "text" },
    {
      name: "state",
      label: "Statusi",
      type: "select",
      defaultValue: "expiring",
      options: [
        { value: "expiring", label: "Obunasi tugaydi" },
        { value: "covered", label: "Balans yetarli" },
        { value: "all", label: "Hammasi" },
      ],
    },
  ];

  return (
    <div className="space-y-3">
      <InlineFilters storageKey="students-expiring" configurable={false} fields={fields} />

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-ink-muted">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              Jami darslar narxi: <b className="text-ink">{formatSom(total.price)}</b>
            </span>
            <span>
              Joriy balans: <b className="text-ink">{formatSom(total.balance)}</b>
            </span>
            <span>
              Kutilayotgan balans:{" "}
              <b className={total.expected < 0 ? "text-red-600" : "text-ink"}>
                {formatSom(total.expected)}
              </b>
            </span>
          </div>
          <span className="rounded-lg border border-line px-2.5 py-1">
            Umumiy soni <b className="ml-1 text-ink">{rows.length}</b>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas">
              <tr>
                <th className={`${TH} w-12`}>№</th>
                <th className={TH}>{terms.student} ismi</th>
                <th className={TH}>Telefon raqam</th>
                <th className={TH}>{terms.group}</th>
                <th className={TH}>Jami darslar narxi</th>
                <th className={TH}>Joriy balans</th>
                <th className={TH}>Kutilayotgan balans</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Inbox size={22} className="mx-auto mb-2 text-ink-faint" aria-hidden="true" />
                    <div className="text-sm font-medium text-ink-muted">Ma&apos;lumotlar topilmadi</div>
                    <div className="mt-0.5 text-xs text-ink-faint">
                      Ma&apos;lumotlar topilmadi. Filterni o&apos;zgartirib ko&apos;ring.
                    </div>
                  </td>
                </tr>
              ) : (
                visible.map((s, i) => (
                  <tr key={s.id} className="hover:bg-canvas">
                    <td className="px-4 py-3 text-ink-faint">{offset + i + 1}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/education/students/${s.id}`}
                        className="font-medium text-ink hover:text-brand-600"
                      >
                        {s.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{s.phone || "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">{s.group?.name ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{formatSom(s.price)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <BalanceBadge balance={Number(s.balance)} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={s.expected < 0 ? "font-medium text-red-600" : "text-ink-muted"}>
                        {formatSom(s.expected)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePager total={rows.length} page={current} size={size} />
      </div>
    </div>
  );
}
