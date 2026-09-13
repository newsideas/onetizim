/**
 * Telegram Bot API orqali ota-onaga xabar yuborish.
 * TELEGRAM_BOT_TOKEN .env.local ichida turadi (server-only, NEXT_PUBLIC_ emas).
 *
 * To'liq ishlatilishi "Telegram bot integratsiyasi" bosqichida yoziladi
 * (davomat "absent" belgilanganda va balans manfiy bo'lganda avtomatik xabar).
 */
export async function sendTelegramMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN .env.local ichida topilmadi");
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });

  if (!res.ok) {
    throw new Error(`Telegram xabar yuborilmadi: ${res.status}`);
  }

  return res.json();
}
