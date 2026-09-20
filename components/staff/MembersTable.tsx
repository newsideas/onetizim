"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserX } from "lucide-react";
import { removeMember, updateMemberRole } from "@/lib/actions/staff";
import { assignCustomRole } from "@/lib/actions/roles";
import { useDialogs } from "@/components/ui/ConfirmDialog";
import { ROLE_LABELS, type Role } from "@/lib/auth/permissions";
import { INVITABLE_ROLES } from "@/lib/validations/staff";
import { initials } from "@/lib/staff";
import { formatPhone } from "@/lib/auth/identity";
import { formatDate } from "@/lib/utils/date";
import type { OrgMember } from "@/lib/staff";

export function MembersTable({
  members,
  currentUserId,
  customRoles = [],
}: {
  members: OrgMember[];
  currentUserId: string;
  customRoles?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialogs } = useDialogs();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.error ?? null);
      router.refresh();
    });
  }

  /** Qiymat: tayyor rol kaliti yoki `custom:<id>` (maxsus rol). */
  function changeRole(member: OrgMember, value: string) {
    if (value.startsWith("custom:")) {
      const roleId = value.slice("custom:".length);
      if (roleId === member.customRoleId) return;
      return run(() => assignCustomRole(member.userId, roleId));
    }
    if (value === member.role && !member.customRoleId) return;
    run(() => updateMemberRole(member.userId, value as Role));
  }

  async function remove(member: OrgMember) {
    const question = `"${member.name}"ning tizimga kirish huquqini bekor qilmoqchimisiz?`;
    if (!(await confirm(question, { danger: true, confirmLabel: "Ha, bekor qilish" }))) return;
    run(() => removeMember(member.userId));
  }

  return (
    <div className="space-y-2">
      {dialogs}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Xodim</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Qo&apos;shilgan sana</th>
              <th className="px-4 py-3 font-medium">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {members.map((m) => (
              <tr key={m.userId} className="hover:bg-canvas">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                      {initials(m.name)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-ink">{m.name}</div>
                      {m.login && (
                        <div className="truncate text-xs text-ink-faint">
                          {/^998\d{9}$/.test(m.login) ? formatPhone(m.login) : m.login}
                        </div>
                      )}
                    </div>
                    {m.userId === currentUserId && (
                      <span className="shrink-0 rounded-full bg-canvas px-2 py-0.5 text-[11px] text-ink-faint">
                        Siz
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {m.role === "owner" ? (
                    <span className="rounded-full bg-brand-600/10 px-2.5 py-1 text-xs font-medium text-brand-700 dark:text-brand-400">
                      {ROLE_LABELS.owner}
                    </span>
                  ) : (
                    <select
                      value={m.customRoleId ? `custom:${m.customRoleId}` : m.role}
                      onChange={(e) => changeRole(m, e.target.value)}
                      disabled={isPending}
                      aria-label={`${m.name} roli`}
                      className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none disabled:opacity-60"
                    >
                      {INVITABLE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                      {customRoles.map((r) => (
                        <option key={r.id} value={`custom:${r.id}`}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-muted">{formatDate(m.createdAt)}</td>
                <td className="px-4 py-3">
                  {m.role !== "owner" && (
                    <button
                      type="button"
                      onClick={() => remove(m)}
                      disabled={isPending}
                      className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      aria-label="Kirishni bekor qilish"
                      title="Kirishni bekor qilish"
                    >
                      <UserX size={15} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
