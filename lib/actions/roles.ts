"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import { ActionError, runAction } from "@/lib/actions/result";
import { ROLE_LABELS, ROLE_PERMISSIONS, type Role } from "@/lib/auth/permissions";
import { BOSS_ONLY_KEY, CATALOG_ACTIONS, builtinMarker, coarseFromActions } from "@/lib/permission-catalog";

export interface RoleInput {
  name: string;
  comment: string;
  /** "Faqat boss ko'ra oladi": rol faqat direktorga ko'rinadi. */
  bossOnly?: boolean;
  /** Rol oynasida belgilangan amallar (permission-catalog kalitlari). */
  actions: string[];
}

/**
 * Bazadagi ma'lumot darajasi (RLS) belgilangan ruxsatlarni eng ko'p qoplaydigan tayyor roldan olinadi;
 * teng bo'lsa — kichigi (o'qituvchi, buxgalter, administrator).
 */
function deriveBaseRole(coarse: string[]): Exclude<Role, "owner"> {
  const order = ["teacher", "accountant", "manager"] as const;
  let best: (typeof order)[number] = "teacher";
  let bestScore = -1;
  for (const role of order) {
    const allowed = new Set<string>(ROLE_PERMISSIONS[role]);
    const score = coarse.filter((p) => allowed.has(p)).length;
    if (score > bestScore) {
      best = role;
      bestScore = score;
    }
  }
  return best;
}

function revalidateRoles() {
  revalidatePath("/staff");
  revalidatePath("/staff/access");
  revalidatePath("/staff/roles");
}

/** Rol oynasidagi belgilardan asosiy ruxsatlar hisoblanadi; ular bazadagi daraja (RLS) doirasidan chiqmaydi. */
function toRow(input: RoleInput) {
  const name = input.name.trim();
  if (name.length < 2) throw new ActionError("Rol nomini kiriting");
  if (name.length > 60) throw new ActionError("Rol nomi juda uzun");

  const actions = [...new Set(input.actions)].filter((key) => CATALOG_ACTIONS.has(key));
  const wanted = coarseFromActions(actions);
  const baseRole = deriveBaseRole(wanted);
  const allowed = new Set<string>(ROLE_PERMISSIONS[baseRole]);
  const coarse = wanted.filter((p) => allowed.has(p));

  return {
    name,
    comment: input.comment.trim() || null,
    base_role: baseRole,
    // Asosiy ruxsatlar (tekshiruv shular bo'yicha) + rol oynasidagi belgilar (qayta ochganda ko'rsatish uchun).
    permissions: [...coarse, ...actions, ...(input.bossOnly ? [BOSS_ONLY_KEY] : [])],
  };
}

const EDITABLE_BUILT_IN = ["manager", "teacher", "accountant"] as const;

/**
 * Tayyor rolni (Administrator, O'qituvchi, Buxgalter) shu markaz uchun o'zgartiradi: org_roles'da
 * "__builtin:<rol>" belgili qator saqlanadi va shu rolli xodimlarning ruxsatlari undan olinadi.
 */
export async function saveBuiltInRole(role: string, input: RoleInput) {
  return runAction(async () => {
    if (!(EDITABLE_BUILT_IN as readonly string[]).includes(role)) throw new ActionError("Bu rolni o'zgartirib bo'lmaydi");
    const builtIn = role as (typeof EDITABLE_BUILT_IN)[number];
    const { supabase, org } = await assertPermission("roles.manage");

    const actions = [...new Set(input.actions)].filter((key) => CATALOG_ACTIONS.has(key));
    const allowed = new Set<string>(ROLE_PERMISSIONS[builtIn]);
    const coarse = coarseFromActions(actions).filter((p) => allowed.has(p));
    const row = {
      name: ROLE_LABELS[builtIn],
      comment: input.comment.trim() || null,
      base_role: builtIn,
      permissions: [...coarse, ...actions, builtinMarker(builtIn), ...(input.bossOnly ? [BOSS_ONLY_KEY] : [])],
    };

    const { data: existing } = await supabase
      .from("org_roles")
      .select("id")
      .eq("org_id", org.id)
      .contains("permissions", [builtinMarker(builtIn)])
      .limit(1)
      .maybeSingle();
    const { error } = existing
      ? await supabase.from("org_roles").update(row).eq("id", existing.id)
      : await supabase.from("org_roles").insert({ org_id: org.id, ...row });
    if (error) throw new ActionError("Rolni saqlab bo'lmadi: " + error.message);
    revalidateRoles();
  });
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
