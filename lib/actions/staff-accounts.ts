"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import { ActionError, runAction } from "@/lib/actions/result";
import { createAdminClient } from "@/lib/supabase/admin";
import { identityToEmail, parseIdentity } from "@/lib/auth/identity";
import {
  resetPasswordSchema,
  staffAccountSchema,
  type ResetPasswordInput,
  type StaffAccountInput,
} from "@/lib/validations/staff";
import type { Role } from "@/lib/auth/permissions";

function revalidateStaff() {
  revalidatePath("/staff");
  revalidatePath("/staff/access");
}

/** O'quv menejeri faqat o'qituvchi hisoblarini boshqaradi; direktor hammasini. */
function assertCanManageRole(actor: Role, target: Role) {
  if (actor === "owner") return;
  if (actor === "manager" && target === "teacher") return;
  throw new ActionError("Bu rol uchun hisob yaratish yoki o'zgartirishga ruxsatingiz yo'q");
}

const TEACHER_KIND: Record<"manager" | "accountant" | "teacher", "manager" | "admin" | "teacher"> = {
  manager: "manager",
  accountant: "admin",
  teacher: "teacher",
};

/**
 * Xodimga login va parol beradi. Login — shu maktab ichida noyob (telefon raqam
 * yoki direktor o'ylab topgan nom). Parolni yaratuvchi xodimga o'zi yetkazadi.
 */
export async function createStaffAccount(input: StaffAccountInput) {
  return runAction(async () => {
    const parsed = staffAccountSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }
    const v = parsed.data;
    const { org, role: actorRole } = await assertPermission("staff.accounts");
    assertCanManageRole(actorRole, v.role);

    if (!org.slug) throw new ActionError("Maktab manzili (subdomen) belgilanmagan");
    const identity = parseIdentity(v.login);
    if (!identity || identity.kind === "email") throw new ActionError("Loginni to'g'ri kiriting");
    const email = identityToEmail(v.login, org.slug);
    if (!email) throw new ActionError("Loginni to'g'ri kiriting");

    const admin = createAdminClient();

    const { data: created, error: userError } = await admin.auth.admin.createUser({
      email,
      password: v.password,
      email_confirm: true,
      user_metadata: { full_name: v.fullName, login: identity.value },
    });
    if (userError || !created.user) {
      throw new ActionError(
        userError?.message?.toLowerCase().includes("already")
          ? "Bu login band — boshqa login tanlang"
          : "Hisobni yaratib bo'lmadi: " + (userError?.message ?? "noma'lum xato"),
      );
    }
    const userId = created.user.id;

    // Xodim kartasi tanlanmagan bo'lsa, yangisi ochiladi (maosh va jadval shunga bog'lanadi).
    let employeeId = v.employeeId;
    let createdCard = false;
    if (!employeeId) {
      const { data: card, error: cardError } = await admin
        .from("teachers")
        .insert({ org_id: org.id, full_name: v.fullName, kind: TEACHER_KIND[v.role], is_active: true })
        .select("id")
        .single();
      if (cardError || !card) {
        await admin.auth.admin.deleteUser(userId);
        throw new ActionError("Xodim kartasini yaratib bo'lmadi: " + (cardError?.message ?? ""));
      }
      employeeId = card.id as string;
      createdCard = true;
    }

    const { error: memberError } = await admin.from("org_members").insert({
      org_id: org.id,
      user_id: userId,
      role: v.role,
      employee_id: employeeId,
      full_name: v.fullName,
      login: identity.value,
      email,
    });
    if (memberError) {
      await admin.auth.admin.deleteUser(userId);
      if (createdCard && employeeId) await admin.from("teachers").delete().eq("id", employeeId);
      throw new ActionError("A'zolikni saqlab bo'lmadi: " + memberError.message);
    }

    revalidateStaff();
    return { login: identity.value };
  });
}

/** Xodimning parolini yangilaydi (direktor yoki o'quv menejeri). */
export async function resetStaffPassword(userId: string, input: ResetPasswordInput) {
  return runAction(async () => {
    const parsed = resetPasswordSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Parol noto'g'ri");
    }
    const { supabase, org, role: actorRole } = await assertPermission("staff.accounts");

    const { data: member } = await supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", userId)
      .maybeSingle();
    if (!member || member.org_id !== org.id) throw new ActionError("Xodim topilmadi");
    assertCanManageRole(actorRole, member.role as Role);

    const { error } = await createAdminClient().auth.admin.updateUserById(userId, {
      password: parsed.data.password,
    });
    if (error) throw new ActionError("Parolni yangilab bo'lmadi: " + error.message);
    revalidateStaff();
  });
}
