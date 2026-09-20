"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteRole } from "@/lib/actions/roles";
import { ROLE_LABELS, type Role } from "@/lib/auth/permissions";
import { useDialogs } from "@/components/ui/ConfirmDialog";

export interface CustomRole {
  id: string;
  name: string;
  comment: string | null;
  baseRole: Role;
  permissions: string[];
  memberCount: number;
}

export interface BuiltInRoleRow {
  role: Role;
  comment: string;
  memberCount: number;
}

const BUILT_IN_ORDER: Role[] = ["owner", "manager", "teacher", "accountant"];

/** Rollar ro'yxati (Edu tizimdagi "Rollar"): tayyor rollar va markaz o'zi yaratgan rollar. */
export function RolesManager({
  builtIn,
  custom,
  tableReady,
}: {
  builtIn: BuiltInRoleRow[];
  custom: CustomRole[];
  tableReady: boolean;
}) {
  const router = useRouter();
  const { confirm, dialogs } = useDialogs();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  async function remove(role: CustomRole) {
    if (!(await confirm(`"${role.name}" rolini o'chirmoqchimisiz?`, { danger: true, confirmLabel: "Ha, o'chirish" }))) return;
    startTransition(async () => {
      const result = await deleteRole(role.id);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {dialogs}
      <div>
        {tableReady ? (
          <Link
            href="/staff/roles/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            <Plus size={16} aria-hidden="true" /> Rol qo&apos;shish
          </Link>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-lg bg-brand-600/40 px-4 py-2 text-sm font-medium text-white">
            <Plus size={16} aria-hidden="true" /> Rol qo&apos;shish
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase text-ink-muted">
            <tr>
              <th className="w-12 px-4 py-3 font-semibold">№</th>
              <th className="px-4 py-3 font-semibold">Nomi</th>
              <th className="px-4 py-3 font-semibold">Izoh</th>
              <th className="px-4 py-3 font-semibold">Xodimlar</th>
              <th className="w-24 px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {BUILT_IN_ORDER.map((role, index) => {
              const row = builtIn.find((b) => b.role === role);
              return (
                <tr key={role}>
                  <td className="px-4 py-3 text-ink-muted">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-ink">{ROLE_LABELS[role]}</td>
                  <td className="px-4 py-3 text-ink-muted">{row?.comment ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{row?.memberCount ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-ink-faint">Tayyor rol</td>
                </tr>
              );
            })}
            {custom.map((role, index) => (
              <tr key={role.id}>
                <td className="px-4 py-3 text-ink-muted">{BUILT_IN_ORDER.length + index + 1}</td>
                <td className="px-4 py-3 font-medium text-ink">{role.name}</td>
                <td className="px-4 py-3 text-ink-muted">{role.comment ?? "—"}</td>
                <td className="px-4 py-3 text-ink-muted">{role.memberCount}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Link
                      href={`/staff/roles/${role.id}`}
                      aria-label="Tahrirlash"
                      className="rounded-lg p-1.5 text-brand-600 hover:bg-canvas"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(role)}
                      disabled={isPending}
                      aria-label="O'chirish"
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
