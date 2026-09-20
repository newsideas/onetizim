import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { ListPageShell } from "@/components/ui/ListPage";
import {
  STATUS_LABELS,
  effectiveStatus,
  fetchPlatformOrgs,
  type EffectiveStatus,
} from "@/lib/platform";
import { formatPhone } from "@/lib/auth/identity";
import { PUBLIC_DOMAIN } from "@/lib/tenant";
import { daysUntil, formatDate } from "@/lib/utils/date";

const STATUS_CLASS: Record<EffectiveStatus, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  trial: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  expired: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
};

export default async function PlatformOrganizationsPage() {
  const { supabase } = await requirePlatformAdmin();
  const orgs = await fetchPlatformOrgs(supabase);

  return (
    <ListPageShell
      title="O'quv markazlar"
      subtitle={`Platformadagi barcha markazlar — ${orgs.length} ta`}
      actions={
        <Link
          href="/admin/organizations/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-brand-700"
        >
          <Plus size={15} aria-hidden="true" />
          Yangi markaz
        </Link>
      }
    >
      {orgs.length === 0 ? (
        <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
          Hali markaz yo&apos;q. «Yangi markaz» tugmasi orqali birinchisini oching.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-canvas text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Markaz</th>
                <th className="px-4 py-3 font-medium">Direktor (login)</th>
                <th className="px-4 py-3 font-medium">O&apos;quvchi</th>
                <th className="px-4 py-3 font-medium">Xodim</th>
                <th className="px-4 py-3 font-medium">Ochilgan</th>
                <th className="px-4 py-3 font-medium">Obuna</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orgs.map((org) => {
                const status = effectiveStatus(org);
                const endsAt = org.plan === "active" ? org.paid_until : org.trial_ends_at;
                const left = daysUntil(endsAt);
                return (
                  <tr key={org.id} className="align-top hover:bg-canvas">
                    <td className="px-4 py-3">
                      <Link href={`/admin/organizations/${org.id}`} className="font-medium text-ink hover:text-brand-600">
                        {org.name}
                      </Link>
                      <div className={`text-xs ${org.slug ? "text-ink-faint" : "text-amber-600"}`}>
                        {org.slug ? `${org.slug}.${PUBLIC_DOMAIN}` : "Subdomen belgilanmagan"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                      {org.phone ? formatPhone(org.phone) : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink">{org.students}</td>
                    <td className="px-4 py-3 text-ink">{org.members}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{formatDate(org.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[status]}`}>
                        {STATUS_LABELS[status]}
                      </span>
                      {endsAt && status !== "expired" && (
                        <div className="mt-1 text-xs text-ink-faint">
                          {formatDate(endsAt)}
                          {left !== null && left >= 0 ? ` · ${left} kun` : ""}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ListPageShell>
  );
}
