import "server-only";
import { sendTelegramMessage } from "@/lib/telegram/sendMessage";

/**
 * Ota-onaga xabar yuboradi va xatolikni yutib yuboradi.
 *
 * Xabar yuborilmasligi (bot ulanmagan, token noto'g'ri, Telegram ishlamayapti)
 * asosiy amalni — davomat belgilash yoki to'lov saqlash — buzmasligi kerak.
 */
export async function notifyParent(chatId: number | null, text: string) {
  if (!chatId) return;

  try {
    await sendTelegramMessage(chatId, text);
  } catch (e) {
    console.error("Telegram xabar yuborilmadi:", e);
  }
}
