import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Header'dagi global qidiruv (Ctrl+K).
 *
 * RLS o'quvchi va guruhlarni foydalanuvchining o'z tashkiloti bilan
 * cheklaydi, shuning uchun bu yerda org_id'ni alohida filtrlash shart emas.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ students: [], groups: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
  }

  const pattern = `%${q}%`;

  const [{ data: students }, { data: groups }] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name, phone, group:groups(name)")
      .or(`full_name.ilike.${pattern},phone.ilike.${pattern}`)
      .neq("status", "archived")
      .order("full_name")
      .limit(5),
    supabase
      .from("groups")
      .select("id, name")
      .ilike("name", pattern)
      .order("name")
      .limit(5),
  ]);

  return NextResponse.json({
    students: (students ?? []).map((s) => ({
      id: s.id as string,
      name: s.full_name as string,
      hint:
        ((s.group as unknown as { name: string } | null)?.name ??
          (s.phone as string | null)) ||
        "",
    })),
    groups: (groups ?? []).map((g) => ({ id: g.id as string, name: g.name as string })),
  });
}
