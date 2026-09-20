import { requirePermission } from "@/lib/auth/session";
import { getOrgMembers } from "@/lib/staff";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { ListPageShell } from "@/components/ui/ListPage";
import { StaffTabs } from "@/components/staff/StaffTabs";
import {
  NewAccountButton,
  ResetPasswordButton,
  type EmployeeOption,
} from "@/components/staff/StaffAccountsPanel";
import { formatDate } from "@/lib/utils/date";
import { formatPhone } from "@/lib/auth/identity";

const TH = "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase";

/** Telefon bo'lsa chiroyli ko'rinishda, aks holda login o'zi. */
function showLogin(login: string | null): string {
  if (!login) return "—";
  return /^998\d{9}$/.test(login) ? formatPhone(login) : login;
}

/**
 * Xodimlarga login va parol berish. Direktor hammasini boshqaradi; o'quv menejeri
 * faqat o'qituvchilar hisobini yaratadi va parolini yangilaydi.
 */
export default async function StaffAccountsPage() {
  const { supabase, org, role, user } = await requirePermission("staff.accounts");
  const isOwner = role === "owner";

  const [members, { data: employees }] = await Promise.all([
    getOrgMembers(supabase, org.id),
    supabase.from("teachers").select("id, full_name").eq("is_active", true).order("full_name"),
  ]);

  const creatable = isOwner
    ? (["teacher", "manager", "accountant"] as const)
    : (["teacher"] as const);

  return (
    <ListPageShell
      title="Login va parollar"
      subtitle="Xodimlar shu login va parol bilan tizimga kiradi"
      tabs={isOwner ? <StaffTabs current="accounts" /> : undefined}
      actions={
        <NewAccountButton employees={(employees ?? []) as EmployeeOption[]} roles={[...creatable]} />
      }
    >
      {!org.slug && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Markaz manzili (subdomen) belgilanmagan — login yaratib bo&apos;lmaydi.
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas">
              <tr>
                <th className={`${TH} w-12`}>№</th>
                <th className={TH}>Xodim</th>
                <th className={TH}>Login</th>
                <th className={TH}>Rol</th>
                <th className={TH}>Qo&apos;shilgan sana</th>
                <th className={TH}>Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {members.map((m, i) => {
                const canManage = m.userId !== user.id && (isOwner || m.role === "teacher") && m.role !== "owner";
                return (
                  <tr key={m.userId} className="hover:bg-canvas">
                    <td className="px-4 py-3 text-ink-faint">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-ink">{m.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                      {showLogin(m.login ?? (m.email && !m.email.endsWith("@login.edugram.uz") ? m.email : null))}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{ROLE_LABELS[m.role]}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{formatDate(m.createdAt)}</td>
                    <td className="px-4 py-3">
                      {canManage ? <ResetPasswordButton userId={m.userId} name={m.name} /> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ListPageShell>
  );
}
