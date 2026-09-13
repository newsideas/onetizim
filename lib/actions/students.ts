"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/supabase/getCurrentOrg";
import { studentSchema, type StudentInput } from "@/lib/validations/student";

export async function createStudent(input: StudentInput) {
  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
  }
  const values = parsed.data;

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);

  const { error } = await supabase.from("students").insert({
    org_id: orgId,
    group_id: values.groupId,
    full_name: values.fullName,
    phone: values.phone || null,
  });

  if (error) {
    throw new Error("O'quvchi qo'shishda xatolik: " + error.message);
  }

  revalidatePath("/students");
}
