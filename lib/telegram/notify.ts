import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/lib/telegram/sendMessage";
import { logNotification, type NotificationKind } from "@/lib/notifications/log";

/**
 * Ota-onaga xabar yuboradi, yutib yuboradi (bot ulanmagan/token noto'g'ri
 * bo'lsa ham davomat/to'lov kabi asosiy amal buzilmasligi kerak) va
 * natijani notification_log'ga yozadi — "Eslatmalar" bo'limi shu yerdan
 * o'qiydi.
 */
export async function notifyParent(
  supabase: SupabaseClient,
  params: {
    chatId: number | null;
    text: string;
    orgId: string;
    studentId: string;
    kind: NotificationKind;
  },
) {
  const { chatId, text, orgId, studentId, kind } = params;
  if (!chatId) return;

  let success = true;
  try {
    await sendTelegramMessage(chatId, text);
  } catch (e) {
    success = false;
    console.error("Telegram xabar yuborilmadi:", e);
  }

  await logNotification(supabase, { orgId, studentId, kind, message: text, success });
}
