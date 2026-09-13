import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/lib/telegram/sendMessage";
import { telegramTemplates } from "@/lib/telegram/templates";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Telegram botdan keladigan update'lar.
 *
 * Ota-ona "https://t.me/<bot>?start=<student_id>" havolasi orqali botni
 * ochganda Telegram "/start <student_id>" xabarini yuboradi — shu yerda
 * chat_id o'quvchiga bog'lanadi.
 *
 * Xavfsizlik: bu route ochiq (proxy.ts uni himoyadan chiqargan), shuning
 * uchun faqat Telegram chaqira olishini ta'minlash uchun setWebhook'da
 * berilgan secret_token tekshiriladi.
 */
export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await request.json();
  const message = update?.message;
  const chatId: number | undefined = message?.chat?.id;
  const text: string | undefined = message?.text;

  if (!chatId || typeof text !== "string") {
    return NextResponse.json({ ok: true });
  }

  const trimmed = text.trim();

  if (!trimmed.startsWith("/start")) {
    await safeSend(chatId, telegramTemplates.yordam);
    return NextResponse.json({ ok: true });
  }

  const studentId = trimmed.split(/\s+/)[1];

  if (!studentId || !UUID_RE.test(studentId)) {
    await safeSend(chatId, telegramTemplates.yordam);
    return NextResponse.json({ ok: true });
  }

  // Sessiyasiz (anon) client — link_telegram_chat security definer funksiya.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: fullName, error } = await supabase.rpc("link_telegram_chat", {
    p_student_id: studentId,
    p_chat_id: chatId,
  });

  if (error) {
    console.error("link_telegram_chat xatosi:", error.message);
    await safeSend(chatId, telegramTemplates.oquvchiTopilmadi);
    return NextResponse.json({ ok: true });
  }

  await safeSend(
    chatId,
    fullName
      ? telegramTemplates.ulandi(fullName as string)
      : telegramTemplates.oquvchiTopilmadi,
  );

  return NextResponse.json({ ok: true });
}

/**
 * Telegram'ga javob yuborish. Xato bo'lsa ham webhook 200 qaytarishi kerak —
 * aks holda Telegram update'ni qayta-qayta yuborishga urinadi.
 */
async function safeSend(chatId: number, text: string) {
  try {
    await sendTelegramMessage(chatId, text);
  } catch (e) {
    console.error("Telegram xabar yuborilmadi:", e);
  }
}
