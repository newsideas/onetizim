import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { CourseForm } from "@/components/courses/CourseForm";

interface PriceRow {
  branch_id: string;
  available: boolean;
  price: number;
}

/** Kursni tahrirlash: nom, rang va filiallar bo'yicha narxlar. */
export default async function EditCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const { supabase } = await requirePermission("settings.manage");

  const [courseRes, branchesRes, pricesRes] = await Promise.all([
    supabase.from("courses").select("id, name, color").eq("id", courseId).maybeSingle(),
    supabase.from("branches").select("id, name").eq("is_active", true).order("name"),
    supabase.from("course_branch_prices").select("branch_id, available, price").eq("course_id", courseId),
  ]);
  if (!courseRes.data) notFound();

  // Jadval hali yaratilmagan bo'lsa (0053) narxlar bo'sh ko'rinadi.
  const prices = new Map(((pricesRes.data ?? []) as PriceRow[]).map((p) => [p.branch_id, p]));
  const branches = ((branchesRes.data ?? []) as { id: string; name: string }[]).map((b) => {
    const saved = prices.get(b.id);
    return {
      branchId: b.id,
      name: b.name,
      available: saved ? saved.available : true,
      price: saved && Number(saved.price) > 0 ? String(saved.price) : "",
    };
  });

  const color = courseRes.data.color as string | null;
  return (
    <CourseForm
      courseId={courseId}
      initialTitle={courseRes.data.name as string}
      initialColor={color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#000000"}
      branches={branches}
    />
  );
}
