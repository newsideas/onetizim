"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import { ActionError, runAction } from "@/lib/actions/result";
import { notifyParent } from "@/lib/telegram/notify";
import { broadcastSchema, type BroadcastInput } from "@/lib/validations/notification";

/** Faol, Telegram ulangan o'quvchilarning ota-onasiga bir xil xabar yuboradi. */
export async function sendBroadcast(input: BroadcastInput) {
  return runAction(async () => {
    const parsed = broadcastSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }
    const { supabase, org } = await assertPermission("notifications.manage");
    const v = parsed.data;

    let query = supabase
      .from("students")
      .select("id, parent_telegram_chat_id")
      .eq("status", "active")
      .not("parent_telegram_chat_id", "is", null);
    if (v.audience === "group") query = query.eq("group_id", v.groupId);

    const { data: students, error } = await query;
    if (error) throw new ActionError("O'quvchilarni o'qib bo'lmadi: " + error.message);

    const recipients = students ?? [];
    if (recipients.length === 0) {
      throw new ActionError(
        "Telegram ulangan qabul qiluvchi topilmadi (ota-onalar hali botni ulamagan)",
      );
    }

    await Promise.all(
      recipients.map((s) =>
        notifyParent(supabase, {
          chatId: s.parent_telegram_chat_id,
          text: v.message,
          orgId: org.id,
          studentId: s.id,
          kind: "broadcast",
        }),
      ),
    );

    revalidatePath("/notifications");
    return recipients.length;
  });
}
