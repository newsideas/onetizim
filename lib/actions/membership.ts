"use server";

import { createClient } from "@/lib/supabase/server";
import { ActionError, runAction } from "@/lib/actions/result";

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
