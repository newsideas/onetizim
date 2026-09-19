import Link from "next/link";
import { AlertTriangle, Building2, CheckCircle2, Clock, GraduationCap, PlusCircle } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { effectiveStatus, fetchPlatformOrgs } from "@/lib/platform";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { daysUntil, formatDate, monthStartIso } from "@/lib/utils/date";

/** Sinov muddati shuncha kundan kam qolgan maktablar "tugayotgan" hisoblanadi. */
const EXPIRING_SOON_DAYS = 7;

export default async function PlatformPage() {
  const { supabase } = await requirePermission("platform.admin");
  const orgs = await fetchPlatformOrgs(supabase);

  const withStatus = orgs.map((o) => ({ ...o, status: effectiveStatus(o) }));
  const count = (s: "active" | "trial" | "expired") => withStatus.filter((o) => o.status === s).length;
  const totalStudents = orgs.reduce((sum, o) => sum + o.students, 0);
  const monthStart = monthStartIso();
  const newThisMonth = orgs.filter((o) => o.created_at.slice(0, 10) >= monthStart).length;

  const expiringSoon = withStatus
    .filter((o) => o.status === "trial")
    .map((o) => ({ org: o, left: daysUntil(o.trial_ends_at) }))
    .filter((x): x is { org: (typeof withStatus)[number]; left: number } =>
      x.left !== null && x.left <= EXPIRING_SOON_DAYS,
    )
    .sort((a, b) => a.left - b.left);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Platforma</h1>
        <p className="text-sm text-ink-muted">Barcha maktablar bo&apos;yicha umumiy holat</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Jami maktablar" value={orgs.length} icon={Building2} accent="brand" />
        <StatCard label="Faol obuna" value={count("active")} icon={CheckCircle2} accent="green" />
        <StatCard label="Sinov muddatida" value={count("trial")} icon={Clock} accent="blue" />
        <StatCard label="Muddati o'tgan" value={count("expired")} icon={AlertTriangle} accent="red" />
        <StatCard label="Jami o'quvchilar" value={totalStudents} icon={GraduationCap} accent="amber" />
        <StatCard label="Bu oy yangi maktab" value={newThisMonth} icon={PlusCircle} accent="brand" />
      </div>

      <Card>
        <CardHeader
          title="Sinov muddati tugayotganlar"
          action={
            <Link
              href="/platform/organizations"
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              Barcha maktablar
            </Link>
          }
        />
        <div className="p-2">
          {expiringSoon.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-ink-faint">
              {EXPIRING_SOON_DAYS} kun ichida tugaydigan sinov yo&apos;q
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {expiringSoon.map(({ org, left }) => (
                <li key={org.id} className="flex items-center justify-between gap-3 px-2 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink">{org.name}</div>
                    <div className="truncate text-xs text-ink-faint">{org.owner_email ?? "—"}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={left <= 2 ? "font-medium text-red-600" : "text-ink-muted"}>
                      {left <= 0 ? "Bugun tugaydi" : `${left} kun qoldi`}
                    </div>
                    <div className="text-xs text-ink-faint">{org.trial_ends_at ? formatDate(org.trial_ends_at) : "—"}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
