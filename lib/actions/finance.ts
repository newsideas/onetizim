"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import { ActionError, runAction } from "@/lib/actions/result";
import {
  expenseSchema,
  salaryPayoutSchema,
  type ExpenseInput,
  type SalaryPayoutInput,
} from "@/lib/validations/finance";

function revalidateFinance() {
  revalidatePath("/finance/payments");
  revalidatePath("/finance/payments/cashbox");
  revalidatePath("/finance/salaries");
  revalidatePath("/finance/reports");
}

export async function createExpense(input: ExpenseInput) {
  return runAction(async () => {
    const parsed = expenseSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }
    const { supabase, org } = await assertPermission("payments.manage");
    const v = parsed.data;

    const { error } = await supabase.from("expenses").insert({
      org_id: org.id,
      amount: v.amount,
      category: v.category,
      method: v.method,
      spent_at: v.spentAt,
      note: v.note,
      ...(v.cashboxId ? { cashbox_id: v.cashboxId } : {}),
    });
    if (error) throw new ActionError("Xarajatni saqlab bo'lmadi: " + error.message);
    revalidateFinance();
  });
}

/** "Chiqim" oynasidagi tranzaksiya turlari (Moliya → Tranzaksiya turi, turi "Chiqim"). */
export async function getExpenseTypes() {
  return runAction(async () => {
    const { supabase } = await assertPermission("payments.manage");
    const { data } = await supabase
      .from("transaction_types")
      .select("name")
      .eq("kind", "Chiqim")
      .order("name");
    return ((data ?? []) as { name: string }[]).map((t) => t.name);
  });
}

export async function deleteExpense(expenseId: string) {
  return runAction(async () => {
    const { supabase } = await assertPermission("payments.manage");
    const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
    if (error) throw new ActionError("Xarajatni o'chirib bo'lmadi: " + error.message);
    revalidateFinance();
  });
}

export async function createSalaryPayout(input: SalaryPayoutInput) {
  return runAction(async () => {
    const parsed = salaryPayoutSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }
    const { supabase, org } = await assertPermission("salaries.manage");
    const v = parsed.data;

    const { error } = await supabase.from("salary_payouts").insert({
      org_id: org.id,
      employee_id: v.employeeId,
      period: v.period,
      amount: v.amount,
      method: v.method,
      paid_at: v.paidAt,
      note: v.note,
    });
    if (error) throw new ActionError("Oylik to'lovini saqlab bo'lmadi: " + error.message);
    revalidateFinance();
  });
}

export async function deleteSalaryPayout(payoutId: string) {
  return runAction(async () => {
    const { supabase } = await assertPermission("salaries.manage");
    const { error } = await supabase.from("salary_payouts").delete().eq("id", payoutId);
    if (error) throw new ActionError("To'lovni o'chirib bo'lmadi: " + error.message);
    revalidateFinance();
  });
}
