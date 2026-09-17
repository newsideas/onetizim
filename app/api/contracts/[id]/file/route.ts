import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CONTRACT_FILES_BUCKET } from "@/lib/validations/contract";

/**
 * Shartnoma faylini ochadi. Bucket maxfiy — RLS orqali shartnoma shu
 * foydalanuvchining tashkilotiga tegishli ekani tekshiriladi va bir
 * daqiqalik imzolangan havolaga yo'naltiriladi.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: contract } = await supabase
    .from("contracts")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();

  if (!contract?.file_path) {
    return NextResponse.json({ error: "Fayl topilmadi" }, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from(CONTRACT_FILES_BUCKET)
    .createSignedUrl(contract.file_path, 60);

  if (error || !data) {
    return NextResponse.json({ error: "Faylni ochib bo'lmadi" }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}
