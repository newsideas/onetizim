import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/**
 * Header'dagi global qidiruv (Ctrl+K).
 *
 * RLS o'quvchi va guruhlarni foydalanuvchining o'z tashkiloti (o'qituvchi
 * uchun — o'z guruhlari) bilan cheklaydi. O'quvchi kartasini ocha olmaydigan
 * rolga o'quvchilar natijasi qaytarilmaydi.
 */
export async function GET(request: NextRequest) {
  // PostgREST filtr sintaksisini buzadigan belgilar (vergul, qavs) va
  // LIKE maxsus belgilari qidiruv matnidan olib tashlanadi.
  const q = (request.nextUrl.searchParams.get("q") ?? "").replace(/[,()%_\\*]/g, " ").trim();
  if (q.length < 2) {
    return NextResponse.json({ students: [], groups: [] });
  }

  const { supabase, permissions } = await getSession();
  const pattern = `%${q}%`;

  const studentsQuery = permissions.includes("students.view")
    ? supabase
        .from("students")
        .select("id, full_name, phone, group:groups(name)")
        .or(`full_name.ilike.${pattern},phone.ilike.${pattern}`)
        .neq("status", "archived")
        .order("full_name")
        .limit(5)
    : null;

  const [studentsResult, { data: groups }] = await Promise.all([
    studentsQuery,
    supabase.from("groups").select("id, name").ilike("name", pattern).order("name").limit(5),
  ]);

  return NextResponse.json({
    students: (studentsResult?.data ?? []).map((s) => ({
      id: s.id as string,
      name: s.full_name as string,
      hint:
        ((s.group as unknown as { name: string } | null)?.name ?? (s.phone as string | null)) ||
        "",
    })),
    groups: (groups ?? []).map((g) => ({ id: g.id as string, name: g.name as string })),
  });
}
