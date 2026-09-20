"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import { ActionError, runAction } from "@/lib/actions/result";
import {
  cashboxSchema,
  transferSchema,
  type CashboxInput,
  type TransferInput,
} from "@/lib/validations/cashbox";

function revalidateCashbox() {
  revalidatePath("/finance/payments/cashbox");
  revalidatePath("/finance/payments");
}

/** Yangi kassa ochadi (Edu tizimdagi "Yangi kassa qo'shish"). */
export async function createCashbox(input: CashboxInput) {
  return runAction(async () => {
    const parsed = cashboxSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }
    const v = parsed.data;
    const { supabase, org } = await assertPermission("payments.manage");

    const { error } = await supabase.from("cashboxes").insert({
      org_id: org.id,
      name: v.name,
      moderator_id: v.moderatorId,
      accepts_online: v.acceptsOnline ?? false,
      is_archived: v.isArchived ?? false,
    });
    if (error) throw tableError("Kassani saqlab bo'lmadi", error.message);
    revalidateCashbox();
  });
}

export async function updateCashbox(cashboxId: string, input: CashboxInput) {
  return runAction(async () => {
    const parsed = cashboxSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }
    const v = parsed.data;
    const { supabase } = await assertPermission("payments.manage");

    const { data, error } = await supabase
      .from("cashboxes")
      .update({
        name: v.name,
        moderator_id: v.moderatorId,
        accepts_online: v.acceptsOnline ?? false,
        is_archived: v.isArchived ?? false,
      })
      .eq("id", cashboxId)
      .select("id");
    if (error) throw tableError("Kassani yangilab bo'lmadi", error.message);
    if (!data?.length) throw new ActionError("Kassa topilmadi yoki ruxsat yo'q");
    revalidateCashbox();
  });
}

/** Pulni bir kassadan boshqasiga ko'chiradi: jo'natuvchida chiqim, oluvchida kirim bo'lib hisoblanadi. */
export async function createTransfer(input: TransferInput) {
  return runAction(async () => {
    const parsed = transferSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }
    const v = parsed.data;
    const { supabase, org } = await assertPermission("payments.manage");

    const { error } = await supabase.from("cash_transfers").insert({
      org_id: org.id,
      from_cashbox_id: v.fromCashboxId,
      to_cashbox_id: v.toCashboxId,
      amount: v.amount,
      method: v.method,
      transfer_date: v.date,
      note: v.note,
    });
    if (error) throw tableError("Ko'chirishni saqlab bo'lmadi", error.message);
    revalidateCashbox();
  });
}

/** Migratsiya (0057) qo'llanmagan bo'lsa, foydalanuvchiga aniq yo'l ko'rsatiladi. */
function tableError(prefix: string, message: string): ActionError {
  return new ActionError(
    /cashboxes|cash_transfers|schema cache/.test(message)
      ? "Kassa jadvallari bazada yo'q — 0057_cashboxes.sql migratsiyasini ishga tushiring"
      : `${prefix}: ${message}`,
  );
}
