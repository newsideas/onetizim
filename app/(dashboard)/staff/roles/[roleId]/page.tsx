import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { ListPageShell } from "@/components/ui/ListPage";
import { RoleEditor } from "@/components/staff/RoleEditor";
import { BOSS_ONLY_KEY, CATALOG_ACTIONS, actionsFromCoarse } from "@/lib/permission-catalog";

/** Rolni tahrirlash. Eski rollarda faqat asosiy ruxsatlar saqlangan — ular amallarga aylantirib ko'rsatiladi. */
export default async function EditRolePage({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  const { supabase } = await requirePermission("roles.manage");

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
