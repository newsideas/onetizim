import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { ListPageShell } from "@/components/ui/ListPage";
import { OrgPlanControls } from "@/components/platform/OrgPlanControls";
import {
  STATUS_LABELS,
  effectiveStatus,
  fetchPlatformOrgs,
  type EffectiveStatus,
} from "@/lib/platform";
import { termsFor } from "@/lib/segment";
import { ROOT_DOMAIN } from "@/lib/tenant";
import { daysUntil, formatDate } from "@/lib/utils/date";
import type { Segment } from "@/lib/segment";

const STATUS_CLASS: Record<EffectiveStatus, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  trial: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  expired: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
};

export default async function PlatformOrganizationsPage() {
  const { supabase } = await requirePlatformAdmin();
  const orgs = await fetchPlatformOrgs(supabase);

  return (
    <ListPageShell title="Maktablar" subtitle={`Platformadagi barcha muassasalar — ${orgs.length} ta`}>
      {orgs.length === 0 ? (
        <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
          Hali muassasa yo&apos;q.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-canvas text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Muassasa</th>
                <th className="px-4 py-3 font-medium">Direktor (email)</th>
                <th className="px-4 py-3 font-medium">O&apos;quvchi</th>
                <th className="px-4 py-3 font-medium">Xodim</th>
                <th className="px-4 py-3 font-medium">Ro&apos;yxatdan o&apos;tgan</th>
                <th className="px-4 py-3 font-medium">Obuna</th>
                <th className="px-4 py-3 font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orgs.map((org) => {
                const status = effectiveStatus(org);
                const left = daysUntil(org.trial_ends_at);
                return (
                  <tr key={org.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{org.name}</div>
                      <div className="text-xs text-ink-faint">{termsFor(org.type as Segment).label}</div>
                      {org.slug && (
                        <div className="text-xs text-brand-600">
                          {org.slug}.{ROOT_DOMAIN}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{org.owner_email ?? "—"}</td>
                    <td className="px-4 py-3 text-ink">{org.students}</td>
                    <td className="px-4 py-3 text-ink">{org.members}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{formatDate(org.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[status]}`}>
                        {STATUS_LABELS[status]}
                      </span>
                      {org.plan === "trial" && org.trial_ends_at && (
                        <div className="mt-1 text-xs text-ink-faint">
                          {formatDate(org.trial_ends_at)}
                          {left !== null && left >= 0 ? ` · ${left} kun` : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <OrgPlanControls orgId={org.id} orgName={org.name} status={status} />
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
