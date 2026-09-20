import { requirePermission } from "@/lib/auth/session";
import { ListPageShell } from "@/components/ui/ListPage";
import { MonthlyGrid, YearSwitcher, type GridRow } from "@/components/reports/MonthlyGrid";
import { ExportCsvButton } from "@/components/reports/ExportCsvButton";
import { MONTH_LABELS, loadYearFlows, parseYear, sumOf, sumRows } from "@/lib/finance-monthly";

type Activity = "Operatsion" | "Investitsion" | "Moliyaviy";
const ACTIVITIES: Activity[] = ["Operatsion", "Investitsion", "Moliyaviy"];

/**
 * Pul oqimi hisoboti (Edu tizimdagidek): boshlang'ich balans, faoliyat turlari bo'yicha kirim-chiqim
 * va yakuniy balans. Chiqim kategoriyasi "Tranzaksiya turi"dagi faoliyat turiga qarab guruhlanadi
 * (topilmasa — operatsion); o'quvchi to'lovlari va oyliklar operatsion faoliyat.
 */
export default async function CashflowPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const params = await searchParams;
  const year = parseYear(params.year);
  const { supabase } = await requirePermission("finance.reports");
  const flows = await loadYearFlows(supabase, year);

  // Faoliyat turi ustuni (0068) yo'q bo'lsa hamma chiqim operatsion hisoblanadi.
  const { data: types, error: typesError } = await supabase.from("transaction_types").select("name, activity");
  const activityOf = new Map<string, Activity>(
    typesError ? [] : ((types ?? []) as { name: string; activity: Activity }[]).filter((t) => t.activity).map((t) => [t.name, t.activity]),
  );

  const income = sumRows([...flows.income.values()]);
  const outflowByActivity = new Map<Activity, number[][]>(ACTIVITIES.map((a) => [a, []]));
  for (const [category, values] of flows.expense) {
    const activity = activityOf.get(category) ?? "Operatsion";
    outflowByActivity.get(activity)?.push(values);
  }

  const zero = Array<number>(12).fill(0);
  const sections = ACTIVITIES.map((activity) => {
    const kirim = activity === "Operatsion" ? income : zero;
    const chiqim = sumRows(outflowByActivity.get(activity) ?? []);
    return { activity, kirim, chiqim, sof: kirim.map((v, i) => v - chiqim[i]) };
  });

  const netTotal = sumRows(sections.map((s) => s.sof));
  const opening: number[] = [];
  const closing: number[] = [];
  netTotal.forEach((net, i) => {
    opening[i] = i === 0 ? flows.opening : closing[i - 1];
    closing[i] = opening[i] + net;
  });

  const rows: GridRow[] = [
    { label: "Boshlang'ich balans", values: opening, style: "total" },
    ...sections.flatMap((s): GridRow[] => [
      { label: `${s.activity} faoliyat`, style: "section" },
      { label: "Kirim — Jami", values: s.kirim, style: "sub" },
      { label: "Chiqim — Jami", values: s.chiqim, style: "sub" },
      { label: "Sof", values: s.sof, style: "row" },
    ]),
    { label: "Yakuniy balans", values: closing, style: "net" },
  ];

  const csvRows = rows.filter((r) => r.values).map((r) => [r.label, ...(r.values as number[]).map(Math.round)]);

  return (
    <ListPageShell
      title="Pul oqimi hisoboti"
      subtitle={`${year}-yil: oy boshidagi va oxiridagi balans, faoliyat turlari bo'yicha kirim-chiqim (so'm)`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <YearSwitcher basePath="/finance/cashflow" year={year} />
          <ExportCsvButton filename={`pul-oqimi-${year}.csv`} header={["Kategoriya", ...MONTH_LABELS]} rows={csvRows} />
        </div>
      }
      notice={
        flows.missing
          ? "Hisobot funksiyasi bazada topilmadi — 0068 migratsiyasini Supabase SQL Editor'da ishga tushiring."
          : undefined
      }
    >
      <MonthlyGrid rows={rows} />
      <p className="text-xs text-ink-faint">
        Investitsion va moliyaviy faoliyat: Sozlamalar → Tranzaksiya turi bo&apos;limida chiqim turining «Faoliyat turi»ni
        belgilang. Jami yillik sof: {new Intl.NumberFormat("ru-RU").format(Math.round(sumOf(netTotal)))} so&apos;m.
      </p>
    </ListPageShell>
  );
}
