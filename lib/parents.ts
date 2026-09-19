import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * O'quvchini ota-onalar ro'yxatiga bog'laydi. Bir xil F.I.Sh. + telefon
 * bo'lsa mavjud ota-ona ishlatiladi (akasi-ukasi bitta ota-onaga tushadi).
 *
 * Bu qo'shimcha amal: o'quvchi allaqachon saqlangan, shuning uchun bu yerdagi
 * xato o'quvchini saqlashni bekor qilmaydi.
 */
export async function linkParentToStudent(
  supabase: SupabaseClient,
  orgId: string,
  studentId: string,
  parent: { fullName: string | null; phone: string | null; relation?: string | null },
) {
  if (!parent.fullName) return;

  let lookup = supabase
    .from("parents")
    .select("id")
    .eq("org_id", orgId)
    .eq("full_name", parent.fullName);
  lookup = parent.phone ? lookup.eq("phone", parent.phone) : lookup.is("phone", null);
  const { data: existing } = await lookup.limit(1).maybeSingle();

  let parentId = existing?.id as string | undefined;
  if (!parentId) {
    const { data: created, error } = await supabase
      .from("parents")
      .insert({
        org_id: orgId,
        full_name: parent.fullName,
        relation: parent.relation ?? null,
        phone: parent.phone,
      })
      .select("id")
      .single();
    if (error) return;
    parentId = created.id as string;
  }

  await supabase
    .from("student_parents")
    .upsert({ student_id: studentId, parent_id: parentId }, { onConflict: "student_id,parent_id" });
}
