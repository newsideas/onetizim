"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createRole, deleteRole, updateRole } from "@/lib/actions/roles";
import {
  PERMISSION_LABELS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  type Permission,
  type Role,
} from "@/lib/auth/permissions";
import { INVITABLE_ROLES } from "@/lib/validations/staff";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
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
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomRole | null>(null);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [baseRole, setBaseRole] = useState<Role>("manager");
  const [granted, setGranted] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>();

  const available = ROLE_PERMISSIONS[baseRole];

  function openForm(role: CustomRole | null) {
    setEditing(role);
    setName(role?.name ?? "");
    setComment(role?.comment ?? "");
    const base = role?.baseRole ?? "manager";
    setBaseRole(base);
    setGranted(new Set(role ? role.permissions : ROLE_PERMISSIONS[base]));
    setError(undefined);
    setOpen(true);
  }

  function changeBase(next: Role) {
    setBaseRole(next);
    // Yangi asosiy rolda mavjud bo'lmagan ruxsatlar avtomatik olib tashlanadi.
    setGranted((prev) => new Set([...prev].filter((p) => (ROLE_PERMISSIONS[next] as readonly string[]).includes(p))));
  }

  function toggle(permission: Permission) {
    setGranted((prev) => {
      const next = new Set(prev);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  }

  function save() {
    setError(undefined);
    const input = { name, comment, baseRole, permissions: [...granted] };
    startTransition(async () => {
      const result = editing ? await updateRole(editing.id, input) : await createRole(input);
      if (!result.ok) return setError(result.error);
      setOpen(false);
      router.refresh();
    });
  }

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
      <div className="flex justify-end">
        <Button onClick={() => openForm(null)} disabled={!tableReady} className="inline-flex items-center gap-2">
          <Plus size={16} /> Rol qo&apos;shish
        </Button>
      </div>
      {error && !open && (
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
              <th className="w-24 px-4 py-3 font-semibold">Amallar</th>
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
                    <button
                      type="button"
                      onClick={() => openForm(role)}
                      aria-label="Tahrirlash"
                      className="rounded-lg p-1.5 text-ink-faint hover:bg-canvas hover:text-ink"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(role)}
                      disabled={isPending}
                      aria-label="O'chirish"
                      className="rounded-lg p-1.5 text-ink-faint hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Rolni tahrirlash" : "Rol qo'shish"}
        tone="brand"
      >
        <div className="space-y-4">
          <p className="text-xs text-ink-faint">* Zarurligini bildiradi</p>
          <div>
            <Label htmlFor="role-name">
              Nomi<span className="ml-0.5 text-red-500">*</span>
            </Label>
            <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="role-comment">Izoh</Label>
            <Input id="role-comment" value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="role-base">Ma&apos;lumotlarga kirish darajasi</Label>
            <Select id="role-base" value={baseRole} onChange={(e) => changeBase(e.target.value as Role)}>
              {INVITABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-ink-faint">
              Rol shu darajadagi ma&apos;lumotlarga kira oladi; quyida uning ichidan kerakli bo&apos;limlarni tanlaysiz.
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink">Ruxsatlar</p>
            <div className="space-y-1.5 rounded-lg bg-canvas p-3">
              {available.map((permission) => (
                <label key={permission} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={granted.has(permission)}
                    onChange={() => toggle(permission)}
                    className="h-4 w-4 rounded border-line accent-brand-600"
                  />
                  {PERMISSION_LABELS[permission]}
                </label>
              ))}
            </div>
          </div>

          <FormError message={error} />

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Orqaga
            </Button>
            <Button type="button" onClick={save} disabled={isPending}>
              {isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
