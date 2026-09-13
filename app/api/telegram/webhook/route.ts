import { NextRequest, NextResponse } from "next/server";

/**
 * Telegram botdan keladigan update'larni qabul qiladi.
 * TODO: 9-bosqich — /start <student_id> buyrug'ini qabul qilib,
 * telegram_links jadvaliga chat_id yozish.
 */
export async function POST(request: NextRequest) {
  const update = await request.json();
  console.log("Telegram update:", update);
  return NextResponse.json({ ok: true });
}
