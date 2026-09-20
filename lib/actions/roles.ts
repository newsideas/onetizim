"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import { ActionError, runAction } from "@/lib/actions/result";
import { ALL_PERMISSIONS, isRole, ROLE_PERMISSIONS, type Role } from "@/lib/auth/permissions";

export interface RoleInput {
  name: string;
  comment: string;
  baseRole: Role;
  permissions: string[];
}

function revalidateRoles() {
  revalidatePath("/staff");
  revalidatePath("/staff/access");
  revalidatePath("/staff/roles");
}

/** Maxsus rol ruxsatlari asosiy rol doirasidan chiqmaydi (haqiqiy himoya RLS'da, asosiy rol bo'yicha). */
function toRow(input: RoleInput) {
  const name = input.name.trim();
  if (name.length < 2) throw new ActionError("Rol nomini kiriting");
  if (name.length > 60) throw new ActionError("Rol nomi juda uzun");
  if (!isRole(input.baseRole) || input.baseRole === "owner") throw new ActionError("Asosiy rolni tanlang");

  const allowed = new Set<string>(ROLE_PERMISSIONS[input.baseRole]);
  const known = new Set<string>(ALL_PERMISSIONS);
  const permissions = input.permissions.filter((p) => known.has(p) && allowed.has(p));

  return {
    name,
    comment: input.comment.trim() || null,
    base_role: input.baseRole,
    permissions,
  };
}

export async function createRole(input: RoleInput) {
  return runAction(async () => {
    const { supabase, org } = await assertPermission("roles.manage");
    const { error } = await supabase.from("org_roles").insert({ org_id: org.id, ...toRow(input) });
    if (error) throw new ActionError("Rolni saqlab bo'lmadi: " + error.message);
    revalidateRoles();
  });
}

export async function updateRole(roleId: string, input: RoleInput) {
  return runAction(async () => {
    const { supabase } = await assertPermission("roles.manage");
    const row = toRow(input);
    const { error } = await supabase.from("org_roles").update(row).eq("id", roleId);
    if (error) throw new ActionError("Rolni yangilab bo'lmadi: " + error.message);
    // Asosiy rol o'zgargan bo'lsa, shu rolga ulangan xodimlarning bazadagi darajasi ham mos bo'lishi kerak.
    await supabase.from("org_members").update({ role: row.base_role }).eq("custom_role_id", roleId);
    revalidateRoles();
  });
}

export async function deleteRole(roleId: string) {
  return runAction(async () => {
    const { supabase } = await assertPermission("roles.manage");
    const { count } = await supabase
      .from("org_members")
      .select("user_id", { count: "exact", head: true })
      .eq("custom_role_id", roleId);
    if ((count ?? 0) > 0) throw new ActionError("Bu rolga xodimlar biriktirilgan — avval ularning rolini o'zgartiring");
    const { error } = await supabase.from("org_roles").delete().eq("id", roleId);
    if (error) throw new ActionError("Rolni o'chirib bo'lmadi: " + error.message);
    revalidateRoles();
  });
}

/** Xodimga maxsus rol biriktiradi: bazadagi daraja asosiy rolga, ruxsatlar maxsus rolga moslanadi. */
export async function assignCustomRole(userId: string, roleId: string) {
  return runAction(async () => {
    const { supabase } = await assertPermission("roles.manage");

    const { data: role } = await supabase.from("org_roles").select("base_role").eq("id", roleId).maybeSingle();
    if (!role) throw new ActionError("Rol topilmadi");

    const { data: member } = await supabase.from("org_members").select("role").eq("user_id", userId).maybeSingle();
    if (member?.role === "owner") throw new ActionError("Tashkilot egasining rolini o'zgartirib bo'lmaydi");

    const { error } = await supabase
      .from("org_members")
      .update({ role: role.base_role, custom_role_id: roleId })
      .eq("user_id", userId);
    if (error) throw new ActionError("Rolni biriktirib bo'lmadi: " + error.message);
    revalidateRoles();
  });
}
