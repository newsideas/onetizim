import { NextRequest, NextResponse } from "next/server";

/**
 * TODO: 7-bosqich — davomat belgilash (present/absent/late) va
 * "absent" holatda ota-onaga Telegram xabar yuborish.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log("Attendance:", body);
  return NextResponse.json({ ok: true });
}
