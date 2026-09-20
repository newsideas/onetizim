import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { effectiveStatus, fetchPlatformOrgs, fetchPlatformPayments } from "@/lib/platform";
import { Card, CardHeader } from "@/components/ui/Card";
import { MonthBars } from "@/components/platform/MonthBars";
import { formatSom } from "@/lib/utils/currency";
import { daysUntil, formatDate, monthsAgo, monthStartIso } from "@/lib/utils/date";

/** Obunasi shuncha kundan kam qolgan markazlar "tugayotgan" hisoblanadi. */
const EXPIRING_SOON_DAYS = 7;
const CHART_MONTHS = 6;
const SHORT_MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-xs text-ink-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-ink tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-ink-faint">{hint}</div>}
    </div>
  );
}

/** Super admin bosh sahifasi: markazlar, tushum va obuna holati (minimal analitika). */
export default async function PlatformPage() {
  const { supabase } = await requirePlatformAdmin();
  const [orgs, payments] = await Promise.all([fetchPlatformOrgs(supabase), fetchPlatformPayments(supabase)]);

  const withStatus = orgs.map((o) => ({ ...o, status: effectiveStatus(o) }));
  const count = (s: "active" | "trial" | "expired") => withStatus.filter((o) => o.status === s).length;
  const totalStudents = orgs.reduce((sum, o) => sum + o.students, 0);

  const thisMonth = monthStartIso().slice(0, 7);
  const revenueTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const revenueMonth = payments.filter((p) => p.paid_at.startsWith(thisMonth)).reduce((sum, p) => sum + p.amount, 0);

  const months = Array.from({ length: CHART_MONTHS }, (_, i) => monthsAgo(CHART_MONTHS - 1 - i));
  // Qisqa oy nomlari: "Iyun" va "Iyul" bir xil bo'lib qolmasligi uchun alohida ro'yxat.
  const monthLabel = (start: string) => SHORT_MONTHS[Number(start.slice(5, 7)) - 1];
  const revenueBars = months.map((m) => {
    const value = payments.filter((p) => p.paid_at.startsWith(m.slice(0, 7))).reduce((s, p) => s + p.amount, 0);
    return { label: monthLabel(m), value, display: value >= 1_000_000 ? `${+(value / 1_000_000).toFixed(1)} mln` : formatSom(value) };
  });
  const newOrgBars = months.map((m) => {
    const value = orgs.filter((o) => o.created_at.startsWith(m.slice(0, 7))).length;
    return { label: monthLabel(m), value, display: String(value) };
  });

  const orgName = new Map(orgs.map((o) => [o.id, o.name]));

  const expiringSoon = withStatus
    .filter((o) => o.status !== "expired")
    .map((o) => ({ org: o, endsAt: o.plan === "active" ? o.paid_until : o.trial_ends_at }))
    .map((x) => ({ ...x, left: daysUntil(x.endsAt) }))
    .filter((x): x is typeof x & { left: number } => x.left !== null && x.left <= EXPIRING_SOON_DAYS)
    .sort((a, b) => a.left - b.left);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Umumiy ko&apos;rsatkichlar</h1>
          <p className="text-sm text-ink-muted">O&apos;quv markazlar va platforma tushumi</p>
        </div>
        <Link
          href="/admin/organizations/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-brand-700"
        >
          Yangi markaz
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="O'quv markazlar"
          value={orgs.length}
          hint={`${count("active")} faol · ${count("trial")} sinovda · ${count("expired")} muddati o'tgan`}
        />
        <Kpi label="Shu oy tushum" value={formatSom(revenueMonth)} />
        <Kpi label="Jami tushum" value={formatSom(revenueTotal)} hint={`${payments.length} ta to'lov`} />
        <Kpi label="Jami o'quvchilar" value={totalStudents} hint="Barcha markazlarda faol" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Tushum (oxirgi 6 oy)" />
          <div className="p-4">
            <MonthBars items={revenueBars} emptyLabel="Hali to'lov yo'q" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Yangi markazlar (oxirgi 6 oy)" />
          <div className="p-4">
            <MonthBars items={newOrgBars} emptyLabel="Hali markaz yo'q" />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Obunasi tugayotganlar"
            action={
              <Link href="/admin/organizations" className="text-xs font-medium text-brand-600 hover:underline">
                Barcha markazlar
              </Link>
            }
          />
          <div className="p-2">
            {expiringSoon.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-ink-faint">
                {EXPIRING_SOON_DAYS} kun ichida tugaydigan obuna yo&apos;q
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {expiringSoon.map(({ org, endsAt, left }) => (
                  <li key={org.id}>
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 text-sm hover:bg-canvas"
                    >
                      <span className="truncate font-medium text-ink">{org.name}</span>
                      <span className="shrink-0 text-right">
                        <span className={left <= 2 ? "font-medium text-red-600" : "text-ink-muted"}>
                          {left <= 0 ? "Bugun tugaydi" : `${left} kun qoldi`}
                        </span>
                        <span className="block text-xs text-ink-faint">{endsAt ? formatDate(endsAt) : "—"}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="So'nggi to'lovlar"
            action={
              <Link href="/admin/payments" className="text-xs font-medium text-brand-600 hover:underline">
                Hammasi
              </Link>
            }
          />
          <div className="p-2">
            {payments.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-ink-faint">Hali to&apos;lov yo&apos;q</p>
            ) : (
              <ul className="divide-y divide-line">
                {payments.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-2 py-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{orgName.get(p.org_id) ?? "—"}</span>
                      <span className="block text-xs text-ink-faint">
                        {formatDate(p.paid_at)} · {p.months} oy · {p.method}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium text-ink tabular-nums">{formatSom(p.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
