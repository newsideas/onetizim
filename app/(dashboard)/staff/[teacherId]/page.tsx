import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, Building2, Check, DollarSign, Frown, Lock, Percent, Phone, X } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { TEACHER_KIND_LABELS, type TeacherKind } from "@/lib/validations/staff";
import { formatSom } from "@/lib/utils/currency";
import { HAFTA_KUNLARI, formatDate, nextMonth, todayIso } from "@/lib/utils/date";

const TABS = [
  { key: "transactions", label: "Tranzaksiyalar tarixi" },
  { key: "students-payments", label: "O'quvchilar to'lovlari" },
  { key: "advance", label: "Avans tarixi" },
  { key: "unpaid-history", label: "To'lanmagan tarixi" },
  { key: "unpaid-payments", label: "To'lanmagan to'lovlar" },
  { key: "actions", label: "Harakatlar tarixi" },
  { key: "reminder", label: "Eslatma" },
  { key: "rating", label: "Reyting" },
  { key: "balance", label: "Balans tarixi" },
  { key: "salary", label: "Oylik tarixi" },
  { key: "calls", label: "Qo'ng'iroqlar tarixi" },
  { key: "audit", label: "Harakatlar tarixi (audit)" },
] as const;

const TH = "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase";

interface Payout {
  id: string;
  period: string;
  amount: number;
  method: string;
  paid_at: string;
  note: string | null;
}
interface MoneyItem {
  id: string;
  amount: number;
  reason: string | null;
  given_on: string;
}

function Stat({ icon: Icon, label, value }: { icon: typeof Check; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon size={17} aria-hidden="true" />
      </span>
      <div>
        <div className="text-xs text-ink-faint">{label}</div>
        <div className="text-sm font-semibold text-ink">{value}</div>
      </div>
    </div>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-16 text-center">
        <div className="text-sm font-medium text-ink-muted">Ma&apos;lumotlar topilmadi</div>
        <div className="mt-0.5 text-xs text-ink-faint">Ma&apos;lumotlar topilmadi. Filterni o&apos;zgartirib ko&apos;ring.</div>
      </td>
    </tr>
  );
}

const total = (rows: { amount: number }[]) => rows.reduce((s, r) => s + Number(r.amount), 0);

/** Xodim kartasi (Edu tizimdagi xodim oynasi): chapda ko'rsatkichlar, o'ngda tarix bo'limlari. */
export default async function StaffDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ teacherId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { teacherId } = await params;
  const { tab: requestedTab } = await searchParams;
  const { supabase } = await requirePermission("staff.manage");

  const { data: teacher } = await supabase.from("teachers").select("*").eq("id", teacherId).maybeSingle();
  if (!teacher) notFound();

  const today = todayIso();
  const period = `${today.slice(0, 7)}-01`;
  const rangeEnd = nextMonth(period);
  const tab = TABS.find((t) => t.key === requestedTab)?.key ?? "transactions";

  const [calcRes, payoutsRes, bonusesRes, finesRes, groupsRes, branchesRes] = await Promise.all([
    supabase.rpc("salary_calculation", { p_period: period }),
    supabase
      .from("salary_payouts")
      .select("id, period, amount, method, paid_at, note")
      .eq("employee_id", teacherId)
      .order("paid_at", { ascending: false }),
    supabase
      .from("staff_bonuses")
      .select("id, amount, reason, given_on")
      .eq("employee_id", teacherId)
      .order("given_on", { ascending: false }),
    supabase
      .from("staff_fines")
      .select("id, amount, reason, given_on")
      .eq("employee_id", teacherId)
      .order("given_on", { ascending: false }),
    supabase.from("groups").select("id, name, schedule_days, start_date, end_date").eq("teacher_id", teacherId),
    supabase.from("branches").select("id, name"),
  ]);

  const payouts = (payoutsRes.data ?? []) as Payout[];
  const bonuses = (bonusesRes.data ?? []) as MoneyItem[];
  const fines = (finesRes.data ?? []) as MoneyItem[];
  const groups = (groupsRes.data ?? []) as {
    id: string;
    name: string;
    schedule_days: string[] | null;
    start_date: string | null;
    end_date: string | null;
  }[];
  const calc = ((calcRes.data ?? []) as { employee_id: string; accrued: number; paid: number }[]).find(
    (r) => r.employee_id === teacherId,
  );

  // Davomat: shu oyda bugungacha o'tgan dars kunlari va shundan davomat belgilanganlari.
  const groupIds = groups.map((g) => g.id);
  const attendanceRes = groupIds.length
    ? await supabase
        .from("attendance")
        .select("group_id, lesson_date")
        .in("group_id", groupIds)
        .gte("lesson_date", period)
        .lt("lesson_date", rangeEnd)
    : { data: [] as { group_id: string; lesson_date: string }[] };
  const markedCount = new Set((attendanceRes.data ?? []).map((a) => `${a.group_id}|${a.lesson_date}`)).size;

  let scheduled = 0;
  const [py, pm] = period.split("-").map(Number);
  const lastDay = new Date(Date.UTC(py, pm, 0)).getUTCDate();
  for (const g of groups) {
    for (let d = 1; d <= lastDay; d++) {
      const iso = `${period.slice(0, 7)}-${String(d).padStart(2, "0")}`;
      if (iso > today) break;
      if ((g.start_date && iso < g.start_date) || (g.end_date && iso > g.end_date)) continue;
      const weekday = HAFTA_KUNLARI[(new Date(Date.UTC(py, pm - 1, d)).getUTCDay() + 6) % 7];
      if (g.schedule_days?.includes(weekday)) scheduled++;
    }
  }
  const attendancePct = scheduled > 0 ? Math.min(100, Math.round((markedCount / scheduled) * 100)) : 0;

  const inMonth = (r: MoneyItem) => r.given_on >= period && r.given_on < rangeEnd;
  const monthBonus = total(bonuses.filter(inMonth));
  const monthFine = total(fines.filter(inMonth));
  const accrued = Number(calc?.accrued ?? 0);
  const paid = Number(calc?.paid ?? 0);
  const unpaid = Math.max(0, accrued - paid);
  const rate = teacher.salary_type === "fixed" && teacher.rate != null ? Number(teacher.rate) : 0;

  const branchName = new Map((branchesRes.data ?? []).map((b) => [b.id as string, b.name as string]));
  const branchNames = ((teacher.branch_ids ?? []) as string[]).map((id) => branchName.get(id)).filter(Boolean);
  const kindLabel = TEACHER_KIND_LABELS[teacher.kind as TeacherKind] ?? teacher.kind;

  const transactions = [
    ...payouts.map((p) => ({ key: `p${p.id}`, date: p.paid_at, type: "Oylik to'lovi", note: p.note, amount: -Number(p.amount) })),
    ...bonuses.map((b) => ({ key: `b${b.id}`, date: b.given_on, type: "Bonus", note: b.reason, amount: Number(b.amount) })),
    ...fines.map((f) => ({ key: `f${f.id}`, date: f.given_on, type: "Jarima", note: f.reason, amount: -Number(f.amount) })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const initials = (teacher.full_name as string)
    .split(/\s+/)
    .slice(0, 2)
    .map((p: string) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="space-y-4">
      <Link href="/staff" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" /> Xodimlar
      </Link>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-xl border border-line bg-surface p-4">
          <div className="text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-brand-50 text-3xl font-semibold text-brand-600">
              {initials}
            </div>
            <span className="-mt-3 inline-block rounded-full bg-brand-600 px-3 py-0.5 text-xs font-medium text-white">
              {kindLabel}
            </span>
            <h1 className="mt-2 text-lg font-semibold text-ink">{teacher.full_name}</h1>
            {teacher.phone && (
              <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-ink-muted">
                <Phone size={13} aria-hidden="true" /> {teacher.phone}
              </p>
            )}
            {branchNames.length > 0 && (
              <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-ink-faint">
                <Building2 size={13} aria-hidden="true" /> {branchNames.join(", ")}
              </p>
            )}
            {!teacher.is_active && (
              <p className="mt-2 text-xs text-red-500">
                Nofaol{teacher.left_on ? ` · ketgan: ${formatDate(teacher.left_on)}` : ""}
                {teacher.leave_reason ? ` · ${teacher.leave_reason}` : ""}
              </p>
            )}
          </div>

          <div className="space-y-3 border-t border-line pt-4">
            <Stat icon={Check} label="Davomat" value={`${markedCount} / ${scheduled}`} />
            <Stat icon={Percent} label="Davomatdan foizi" value={`${attendancePct}%`} />
            <Stat icon={Lock} label="Bonus" value={formatSom(monthBonus)} />
            <Stat icon={X} label="Avans" value={formatSom(0)} />
            <Stat icon={Frown} label="Jarima" value={formatSom(monthFine)} />
            <Stat icon={Briefcase} label="Akladi" value={formatSom(rate)} />
            <Stat icon={Building2} label="Oylik" value={formatSom(accrued)} />
            <Stat icon={DollarSign} label="To'lanmagan" value={formatSom(unpaid)} />
          </div>
        </aside>

        <section className="min-w-0 space-y-3">
          <nav aria-label="Xodim bo'limlari" className="flex flex-wrap gap-2 rounded-xl border border-line bg-surface p-3">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={`/staff/${teacherId}?tab=${t.key}`}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === t.key ? "bg-brand-600 text-white" : "bg-canvas text-ink hover:bg-line/60"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            {tab === "transactions" && (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-canvas">
                  <tr>
                    <th className={`${TH} w-12`}>№</th>
                    <th className={TH}>Sana</th>
                    <th className={TH}>Turi</th>
                    <th className={TH}>Izoh</th>
                    <th className={`${TH} text-right`}>Miqdori</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {transactions.length === 0 ? (
                    <EmptyRow cols={5} />
                  ) : (
                    transactions.map((t, i) => (
                      <tr key={t.key}>
                        <td className="px-4 py-3 text-ink-faint">{i + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{formatDate(t.date)}</td>
                        <td className="px-4 py-3 text-ink">{t.type}</td>
                        <td className="px-4 py-3 text-ink-muted">{t.note || "—"}</td>
                        <td
                          className={`px-4 py-3 text-right whitespace-nowrap ${
                            t.amount < 0 ? "text-red-500" : "text-emerald-600"
                          }`}
                        >
                          {t.amount < 0 ? "−" : "+"} {formatSom(Math.abs(t.amount))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === "salary" && (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-canvas">
                  <tr>
                    <th className={`${TH} w-12`}>№</th>
                    <th className={TH}>Davr</th>
                    <th className={TH}>To&apos;langan sana</th>
                    <th className={TH}>Usul</th>
                    <th className={TH}>Izoh</th>
                    <th className={`${TH} text-right`}>Miqdori</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {payouts.length === 0 ? (
                    <EmptyRow cols={6} />
                  ) : (
                    payouts.map((p, i) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3 text-ink-faint">{i + 1}</td>
                        <td className="px-4 py-3 text-ink-muted">{formatDate(p.period).slice(3)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{formatDate(p.paid_at)}</td>
                        <td className="px-4 py-3 text-ink-muted">{p.method}</td>
                        <td className="px-4 py-3 text-ink-muted">{p.note || "—"}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap text-ink">{formatSom(Number(p.amount))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab !== "transactions" && tab !== "salary" && (
              <table className="w-full text-left text-sm">
                <tbody>
                  <EmptyRow cols={1} />
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
