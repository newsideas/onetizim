import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { ListPageShell } from "@/components/ui/ListPage";
import { RoleEditor } from "@/components/staff/RoleEditor";
import { ROLE_LABELS, ROLE_PERMISSIONS, isRole } from "@/lib/auth/permissions";
import { BOSS_ONLY_KEY, CATALOG_ACTIONS, actionsFromCoarse, builtinMarker } from "@/lib/permission-catalog";

const BUILT_IN_COMMENTS: Record<string, string> = {
  manager: "O'quvchi qabul qiladi",
  teacher: "Ustoz",
  accountant: "To'lovlarni qabul qiladi",
};

/**
 * Rolni tahrirlash. Eski rollarda faqat asosiy ruxsatlar saqlangan — ular amallarga aylantirib ko'rsatiladi.
 * `builtin-<rol>` — tayyor rol (Administrator, O'qituvchi, Buxgalter): o'zgartirilmagan bo'lsa standart ruxsatlar ko'rsatiladi.
 */
export default async function EditRolePage({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  const { supabase } = await requirePermission("roles.manage");

  if (roleId.startsWith("builtin-")) {
    const role = roleId.slice("builtin-".length);
    if (!isRole(role) || role === "owner") notFound();

    const { data: override } = await supabase
      .from("org_roles")
      .select("comment, permissions")
      .contains("permissions", [builtinMarker(role)])
      .limit(1)
      .maybeSingle();

    const stored: string[] = override?.permissions ?? [];
    const saved = stored.filter((p) => CATALOG_ACTIONS.has(p));
    const actions = override ? saved : actionsFromCoarse(ROLE_PERMISSIONS[role]);

    return (
      <ListPageShell title="Rolni tahrirlash" subtitle={ROLE_LABELS[role]}>
        <RoleEditor
          builtIn={role}
          initial={{
            id: roleId,
            name: ROLE_LABELS[role],
            comment: override ? (override.comment ?? "") : (BUILT_IN_COMMENTS[role] ?? ""),
            bossOnly: stored.includes(BOSS_ONLY_KEY),
            actions,
          }}
        />
      </ListPageShell>
    );
  }

  const { data: role } = await supabase
    .from("org_roles")
    .select("id, name, comment, permissions")
    .eq("id", roleId)
    .maybeSingle();
  if (!role) notFound();

  const stored: string[] = role.permissions ?? [];
  const saved = stored.filter((p) => CATALOG_ACTIONS.has(p));
  const actions = saved.length > 0 ? saved : actionsFromCoarse(stored);

  return (
    <ListPageShell title="Rolni tahrirlash" subtitle={role.name}>
      <RoleEditor
        initial={{
          id: role.id,
          name: role.name,
          comment: role.comment ?? "",
          bossOnly: stored.includes(BOSS_ONLY_KEY),
          actions,
        }}
      />
    </ListPageShell>
  );
}
