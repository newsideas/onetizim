import type { SupabaseClient } from "@supabase/supabase-js";

/** Yil bo'yicha oylik kirim-chiqim (P&L va Pul oqimi hisobotlari uchun umumiy ma'lumot). */
export interface YearFlows {
  year: number;
  /** To'lov usuli -> 12 oylik kirim. */
  income: Map<string, number[]>;
  /** Chiqim kategoriyasi -> 12 oylik chiqim (oylik to'lovlari "Oylik (xodimlar)" kategoriyasida). */
  expense: Map<string, number[]>;
  /** Yil boshidagi balans (kirim - chiqim, oldingi yillar). */
  opening: number;
  /** 0068 migratsiyasi qo'llanmagan bo'lsa true. */
  missing: boolean;
}

export const MONTH_LABELS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr",
];

export const METHOD_LABELS: Record<string, string> = {
  naqd: "Naqd",
  karta: "Plastik",
  terminal: "Terminal",
  click: "Click",
  payme: "Payme",
  boshqa: "Boshqa",
};

const zeros = () => Array<number>(12).fill(0);

/** Yil raqamini tekshiradi; noto'g'ri bo'lsa joriy yil. */
export function parseYear(value: string | undefined): number {
  const y = Number(value);
  return Number.isInteger(y) && y >= 2000 && y <= 2100 ? y : new Date().getFullYear();
}

/** Bazadagi `finance_year_flows` funksiyasidan oylik yig'indilarni oladi. */
export async function loadYearFlows(supabase: SupabaseClient, year: number): Promise<YearFlows> {
  const flows: YearFlows = { year, income: new Map(), expense: new Map(), opening: 0, missing: false };
  const { data, error } = await supabase.rpc("finance_year_flows", { p_year: year });
  if (error) return { ...flows, missing: true };

  const add = (map: Map<string, number[]>, key: string, month: number, amount: number) => {
    const row = map.get(key) ?? zeros();
    if (month >= 1 && month <= 12) row[month - 1] += amount;
    map.set(key, row);
  };

  for (const r of (data ?? []) as { kind: string; category: string; month: number; total: number | string }[]) {
    const amount = Number(r.total);
    if (r.kind === "income") add(flows.income, r.category, r.month, amount);
    else if (r.kind === "expense") add(flows.expense, r.category || "Boshqa", r.month, amount);
    else if (r.kind === "salary") add(flows.expense, "Oylik (xodimlar)", r.month, amount);
    else if (r.kind === "opening") flows.opening = amount;
  }
  return flows;
}

/** Bir nechta 12 oylik qatorni oyma-oy qo'shadi. */
export function sumRows(rows: number[][]): number[] {
  const out = zeros();
  for (const row of rows) row.forEach((v, i) => (out[i] += v));
  return out;
}

export const sumOf = (row: number[]) => row.reduce((a, b) => a + b, 0);
