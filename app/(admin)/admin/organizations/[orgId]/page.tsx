import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import {
  STATUS_LABELS,
  effectiveStatus,
  fetchPlatformOrgs,
  fetchPlatformPayments,
} from "@/lib/platform";
import { Card, CardHeader } from "@/components/ui/Card";
import { OrgPlanControls } from "@/components/platform/OrgPlanControls";
import { PaymentForm } from "@/components/platform/PaymentForm";
import { DirectorPasswordForm } from "@/components/platform/DirectorPasswordForm";
import { SubdomainForm } from "@/components/platform/SubdomainForm";
import { formatPhone } from "@/lib/auth/identity";
import { ROOT_DOMAIN } from "@/lib/tenant";
import { formatSom } from "@/lib/utils/currency";
import { daysUntil, formatDate, todayIso } from "@/lib/utils/date";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 text-sm">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}

/** Bitta markaz: ma'lumotlari, obunasi, to'lovlari va direktor paroli. */
export default async function PlatformOrgPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const { supabase } = await requirePlatformAdmin();

  const [orgs, allPayments] = await Promise.all([fetchPlatformOrgs(supabase), fetchPlatformPayments(supabase)]);
  const org = orgs.find((o) => o.id === orgId);
  if (!org) notFound();

  const payments = allPayments.filter((p) => p.org_id === orgId);
  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const status = effectiveStatus(org);
  const endsAt = org.plan === "active" ? org.paid_until : org.trial_ends_at;
  const left = daysUntil(endsAt);
  const host = org.slug ? `${org.slug}.${ROOT_DOMAIN}` : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/organizations" className="text-xs text-ink-muted hover:text-ink">
          ← Barcha markazlar
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-ink">{org.name}</h1>
        <p className={`text-sm ${host ? "text-brand-600" : "text-amber-600"}`}>{host ?? "Subdomen belgilanmagan"}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Ma'lumotlar" />
          <dl className="divide-y divide-line px-4 py-1">
            <Row label="Direktor (login)">{org.phone ? formatPhone(org.phone) : "—"}</Row>
            <Row label="O'quvchilar">{org.students}</Row>
            <Row label="Xodimlar">{org.members}</Row>
            <Row label="Ochilgan">{formatDate(org.created_at)}</Row>
            <Row label="Jami to'langan">{formatSom(paidTotal)}</Row>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Obuna" />
          <div className="space-y-3 p-4">
            <div className="text-sm">
              <span className="font-medium text-ink">{STATUS_LABELS[status]}</span>
              {endsAt && (
                <span className="text-ink-muted">
                  {" "}
                  · {formatDate(endsAt)}
                  {left !== null && left >= 0 ? ` (${left} kun qoldi)` : ""}
                </span>
              )}
            </div>
            <OrgPlanControls orgId={org.id} orgName={org.name} status={status} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Subdomen" />
        <div className="max-w-xl p-4">
          <SubdomainForm orgId={org.id} orgName={org.name} currentSlug={org.slug} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="To'lov qabul qilish" />
          <div className="p-4">
            <PaymentForm orgId={org.id} today={todayIso()} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Direktor paroli" />
          <div className="p-4">
            <DirectorPasswordForm orgId={org.id} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="To'lovlar tarixi" />
        {payments.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-ink-faint">Hali to&apos;lov yo&apos;q</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-ink-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Sana</th>
                  <th className="px-4 py-2 font-medium">Summa</th>
                  <th className="px-4 py-2 font-medium">Muddat</th>
                  <th className="px-4 py-2 font-medium">Turi</th>
                  <th className="px-4 py-2 font-medium">Izoh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-ink-muted">{formatDate(p.paid_at)}</td>
                    <td className="px-4 py-2 font-medium text-ink tabular-nums">{formatSom(p.amount)}</td>
                    <td className="px-4 py-2 text-ink-muted">{p.months} oy</td>
                    <td className="px-4 py-2 text-ink-muted">{p.method}</td>
                    <td className="px-4 py-2 text-ink-muted">{p.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
