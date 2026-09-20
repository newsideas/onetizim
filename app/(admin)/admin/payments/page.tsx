import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { fetchPlatformOrgs, fetchPlatformPayments } from "@/lib/platform";
import { formatSom } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";

/** Barcha o'quv markazlarning platformaga to'lovlari. */
export default async function PlatformPaymentsPage() {
  const { supabase } = await requirePlatformAdmin();
  const [orgs, payments] = await Promise.all([fetchPlatformOrgs(supabase), fetchPlatformPayments(supabase)]);
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">To&apos;lovlar</h1>
        <p className="text-sm text-ink-muted">
          {payments.length} ta to&apos;lov · jami {formatSom(total)}. To&apos;lovni markaz sahifasidan yozasiz.
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
          Hali to&apos;lov yo&apos;q. Markazni oching va «To&apos;lov qabul qilish» orqali yozing.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas text-xs text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Sana</th>
                <th className="px-4 py-3 font-medium">Markaz</th>
                <th className="px-4 py-3 font-medium">Summa</th>
                <th className="px-4 py-3 font-medium">Muddat</th>
                <th className="px-4 py-3 font-medium">Turi</th>
                <th className="px-4 py-3 font-medium">Izoh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-canvas">
                  <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{formatDate(p.paid_at)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/organizations/${p.org_id}`} className="font-medium text-ink hover:text-brand-600">
                      {orgName.get(p.org_id) ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-ink tabular-nums">{formatSom(p.amount)}</td>
                  <td className="px-4 py-3 text-ink-muted">{p.months} oy</td>
                  <td className="px-4 py-3 text-ink-muted">{p.method}</td>
                  <td className="px-4 py-3 text-ink-muted">{p.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
