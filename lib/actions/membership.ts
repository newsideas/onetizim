"use server";

import { createClient } from "@/lib/supabase/server";
import { ActionError, runAction } from "@/lib/actions/result";
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from "@/lib/validations/auth";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const INVITE_ERRORS: Record<string, string> = {
  INVITE_NOT_FOUND: "Taklif topilmadi",
  INVITE_USED: "Bu taklif allaqachon ishlatilgan",
  INVITE_EXPIRED: "Taklif muddati tugagan. Direktordan yangi havola so'rang",
  ALREADY_MEMBER: "Siz allaqachon boshqa muassasa a'zosisiz",
  AUTH_REQUIRED: "Avval tizimga kiring",
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new ActionError("Avval tizimga kiring");
  return { supabase, user };
}

export async function acceptInvite(token: string) {
  return runAction(async () => {
    if (!UUID.test(token)) throw new ActionError(INVITE_ERRORS.INVITE_NOT_FOUND);
    const { supabase } = await requireUser();

    const { error } = await supabase.rpc("accept_invite", { p_token: token });
    if (error) {
      const code = Object.keys(INVITE_ERRORS).find((key) => error.message.includes(key));
      throw new ActionError(code ? INVITE_ERRORS[code] : "Taklifni qabul qilib bo'lmadi");
    }
  });
}

/** A'zoligi yo'q foydalanuvchi o'z muassasasini ochadi (u direktor bo'ladi). */
export async function createOwnOrganization(input: CreateOrganizationInput) {
  return runAction(async () => {
    const parsed = createOrganizationSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }
    const { supabase, user } = await requireUser();

    const { error } = await supabase.from("organizations").insert({
      owner_id: user.id,
      name: parsed.data.orgName,
      type: parsed.data.orgType,
    });

    if (error) {
      throw new ActionError(
        error.code === "23505"
          ? "Sizda allaqachon muassasa bor"
          : "Muassasani yaratib bo'lmadi",
      );
    }
  });
}
