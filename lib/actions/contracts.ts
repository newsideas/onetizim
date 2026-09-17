"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertPermission } from "@/lib/auth/session";
import {
  CONTRACT_FILES_BUCKET,
  calculateDiscount,
  contractSchema,
  type ContractInput,
  type ContractStatus,
} from "@/lib/validations/contract";

const FILE_NAME_PATTERN = /^[0-9a-f-]{36}\.(pdf|jpe?g|png|webp)$/i;

function revalidateContracts() {
  revalidatePath("/finance/contracts");
}

function friendlyError(prefix: string, error: { code?: string; message: string }): Error {
  if (error.code === "23505") return new Error("Bu raqamli shartnoma allaqachon mavjud");
  if (error.code === "42501") return new Error("Tanlangan o'quvchi topilmadi yoki ruxsat yo'q");
  return new Error(`${prefix}: ${error.message}`);
}

/** Brauzer faqat o'z tashkiloti papkasiga yuklagan faylni biriktira oladi. */
function assertOwnFilePath(orgId: string, path: string | null | undefined) {
  if (!path) return;
  const [folder, name, ...rest] = path.split("/");
  if (folder !== orgId || rest.length > 0 || !name || !FILE_NAME_PATTERN.test(name)) {
    throw new Error("Fayl yo'li noto'g'ri");
  }
}

async function buildContractRow(supabase: SupabaseClient, orgId: string, input: ContractInput) {
  const parsed = contractSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
  }
  const values = parsed.data;
  assertOwnFilePath(orgId, values.filePath);

  let discount = null;
  if (values.discountId) {
    const { data, error } = await supabase
      .from("contract_discounts")
      .select("discount_type, amount")
      .eq("id", values.discountId)
      .maybeSingle();
    if (error || !data) throw new Error("Chegirma topilmadi");
    discount = data;
  }

  const discountAmount = calculateDiscount(values.baseAmount, discount);

  return {
    student_id: values.studentId,
    contract_number: values.contractNumber,
    contract_type_id: values.contractTypeId,
    academic_year_id: values.academicYearId,
    discount_id: values.discountId,
    base_amount: values.baseAmount,
    discount_amount: discountAmount,
    amount: values.baseAmount - discountAmount,
    ...(values.filePath !== undefined && {
      file_path: values.filePath,
      file_name: values.filePath ? (values.fileName ?? null) : null,
    }),
  };
}

async function removeFile(supabase: SupabaseClient, path: string | null) {
  if (!path) return;
  await supabase.storage.from(CONTRACT_FILES_BUCKET).remove([path]);
}

export async function createContract(input: ContractInput) {
  const { supabase, org } = await assertPermission("contracts.manage");
  const orgId = org.id;
  const row = await buildContractRow(supabase, orgId, input);

  const { error } = await supabase.from("contracts").insert({ org_id: orgId, ...row });
  if (error) throw friendlyError("Saqlashda xatolik", error);

  revalidateContracts();
}

export async function updateContract(contractId: string, input: ContractInput) {
  const { supabase, org } = await assertPermission("contracts.manage");
  const orgId = org.id;

  const { data: existing } = await supabase
    .from("contracts")
    .select("file_path")
    .eq("id", contractId)
    .maybeSingle();
  if (!existing) throw new Error("Shartnoma topilmadi");

  const row = await buildContractRow(supabase, orgId, input);

  const { error } = await supabase.from("contracts").update(row).eq("id", contractId);
  if (error) throw friendlyError("Yangilashda xatolik", error);

  if ("file_path" in row && existing.file_path && existing.file_path !== row.file_path) {
    await removeFile(supabase, existing.file_path);
  }

  revalidateContracts();
}

export async function setContractStatus(contractId: string, status: ContractStatus) {
  if (status !== "active" && status !== "cancelled") throw new Error("Noto'g'ri holat");

  const { supabase } = await assertPermission("contracts.manage");
  const { error } = await supabase.from("contracts").update({ status }).eq("id", contractId);
  if (error) throw new Error("Holatni o'zgartirishda xatolik: " + error.message);

  revalidateContracts();
}

export async function deleteContract(contractId: string) {
  const { supabase } = await assertPermission("contracts.manage");

  const { data: existing } = await supabase
    .from("contracts")
    .select("file_path")
    .eq("id", contractId)
    .maybeSingle();
  if (!existing) throw new Error("Shartnoma topilmadi");

  const { error } = await supabase.from("contracts").delete().eq("id", contractId);
  if (error) throw new Error("O'chirishda xatolik: " + error.message);

  await removeFile(supabase, existing.file_path);
  revalidateContracts();
}
