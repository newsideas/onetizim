import { NextRequest, NextResponse } from "next/server";

/**
 * TODO: 8-bosqich — to'lov kiritilganda students.balance'ni
 * server action/trigger orqali avtomatik yangilash.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log("Payment:", body);
  return NextResponse.json({ ok: true });
}
