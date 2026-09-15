import Link from "next/link";
import {
  UserPlus,
  Wallet,
  CalendarCheck,
  BookOpen,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, EmptyState } from "@/components/ui/Card";
import { formatSom } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import type {
  DebtorRow,
  RecentPayment,
  MonthRow,
  GroupCount,
} from "@/lib/dashboard";
import type { SegmentTerms } from "@/lib/segment";

/** Qarzdorlar ro'yxati va oxirgi to'lovlar. */
export function FinancialActivity({
  debtors,
  payments,
  debtorCount,
  terms,
}: {
  debtors: DebtorRow[];
  payments: RecentPayment[];
  debtorCount: number;
  terms: SegmentTerms;
}) {
  return (
    <Card>
      <CardHeader
        title="Moliyaviy faollik"
        action={
          <Link
            href="/payments"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
          >
            Barchasi <ArrowRight size={14} />
          </Link>
        }
      />

      <div className="grid gap-px bg-line md:grid-cols-2">
        {/* Qarzdorlar */}
        <div className="bg-surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-red-500" />
            <span className="text-sm font-medium text-ink">
              Qarzdor {terms.studentPlural.toLowerCase()}
            </span>
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-medium text-red-600">
              Top 5
            </span>
          </div>

          {debtors.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-faint">
              Qarzdorlar yo&apos;q
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {debtors.map((d, i) => (
                <li key={d.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-4 text-xs text-ink-faint">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/students/${d.id}`}
                      className="block truncate text-sm font-medium text-ink hover:text-brand-600"
                    >
                      {d.full_name}
                    </Link>
                    <span className="text-xs text-ink-faint">
                      {d.group_name ?? "—"}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-red-600">
                    {formatSom(Math.abs(d.balance))}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {debtorCount > 0 && (
            <p className="mt-3 border-t border-line pt-3 text-xs text-ink-muted">
              Jami {debtorCount} ta qarzdor bor
            </p>
          )}
        </div>

        {/* Oxirgi to'lovlar */}
        <div className="bg-surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <Wallet size={15} className="text-brand-600" />
            <span className="text-sm font-medium text-ink">
              Oxirgi to&apos;lovlar
            </span>
          </div>

          {payments.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-faint">
              Hali to&apos;lov yo&apos;q
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">
                      {p.student_name}
                    </div>
                    <span className="text-xs text-ink-faint">
                      {formatDate(p.paid_at)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    +{formatSom(p.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Oylik tushum va qarzdorlik ustunli diagrammasi. */
export function FinanceChart({ months }: { months: MonthRow[] }) {
  const max = Math.max(1, ...months.map((m) => Math.max(m.paid, m.debt)));

  return (
    <Card>
      <CardHeader title="Moliyaviy tahlil" />
      <div className="p-4">
        {months.length === 0 ? (
          <EmptyState
            title="Ma'lumot yo'q"
            hint="To'lovlar va oylik hisoblar kiritilgach, bu yerda oylar kesimidagi grafik chiziladi."
          />
        ) : (
          <>
            <div className="mb-3 flex items-center gap-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-500" /> Tushum
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-400" /> Qarzdorlik
              </span>
            </div>

            <div className="flex h-48 items-end gap-3 overflow-x-auto">
              {months.map((m) => (
                <div
                  key={m.period}
                  className="flex w-16 flex-none flex-col items-center gap-2"
                >
                  <div className="flex h-40 w-full items-end justify-center gap-1">
                    <div
                      className="w-1/2 rounded-t bg-brand-500"
                      style={{ height: `${(m.paid / max) * 100}%` }}
                      title={`Tushum: ${formatSom(m.paid)}`}
                    />
                    <div
                      className="w-1/2 rounded-t bg-red-400"
                      style={{ height: `${(m.debt / max) * 100}%` }}
                      title={`Qarzdorlik: ${formatSom(m.debt)}`}
                    />
                  </div>
                  <span className="text-[11px] text-ink-faint">
                    {m.label.slice(0, 3)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

/** Oylar kesimida hisob-kitob jadvali. */
export function MonthlyTable({ months }: { months: MonthRow[] }) {
  if (months.length === 0) return null;

  const total = months.reduce(
    (acc, m) => ({
      charged: acc.charged + m.charged,
      paid: acc.paid + m.paid,
      debt: acc.debt + m.debt,
    }),
    { charged: 0, paid: 0, debt: 0 },
  );
  const totalPercent =
    total.charged > 0 ? Math.round((total.paid / total.charged) * 100) : 0;

  return (
    <Card>
      <CardHeader title="Oylar kesimida hisob-kitob" />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-xs text-ink-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Oy</th>
              <th className="px-4 py-3 font-medium">Hisoblangan</th>
              <th className="px-4 py-3 font-medium">To&apos;langan</th>
              <th className="px-4 py-3 font-medium">Qarzdorlik</th>
              <th className="px-4 py-3 font-medium">To&apos;lov foizi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {months.map((m) => (
              <tr key={m.period} className="hover:bg-canvas">
                <td className="px-4 py-3 font-medium text-ink">{m.label}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {formatSom(m.charged)}
                </td>
                <td className="px-4 py-3 text-green-600">{formatSom(m.paid)}</td>
                <td className="px-4 py-3 text-red-600">{formatSom(m.debt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{ width: `${Math.min(100, m.percent)}%` }}
                      />
                    </div>
                    <span className="text-xs text-ink-muted">{m.percent}%</span>
                  </div>
                </td>
              </tr>
            ))}
            <tr className="bg-canvas font-medium">
              <td className="px-4 py-3 text-ink">Jami</td>
              <td className="px-4 py-3 text-ink">{formatSom(total.charged)}</td>
              <td className="px-4 py-3 text-green-700">{formatSom(total.paid)}</td>
              <td className="px-4 py-3 text-red-700">{formatSom(total.debt)}</td>
              <td className="px-4 py-3 text-ink">{totalPercent}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** Muassasa haqida qisqacha ma'lumot. */
export function OrgCard({
  name,
  typeLabel,
  director,
  phone,
  region,
  district,
}: {
  name: string;
  typeLabel: string;
  director: string | null;
  phone: string | null;
  region: string | null;
  district: string | null;
}) {
  const rows: [string, string][] = [
    ["Muassasa nomi", name],
    ["Turi", typeLabel],
    ["Rahbar", director || "—"],
    ["Telefon", phone || "—"],
    ["Manzil", [region, district].filter(Boolean).join(", ") || "—"],
  ];

  return (
    <Card>
      <CardHeader title="Muassasa va tizim" />
      <div className="space-y-3 p-4 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4">
            <span className="text-ink-muted">{label}</span>
            <span className="text-right font-medium text-ink">{value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Guruh/sinf bo'yicha o'quvchilar taqsimoti. */
export function GroupDistribution({
  groups,
  terms,
}: {
  groups: GroupCount[];
  terms: SegmentTerms;
}) {
  const max = Math.max(1, ...groups.map((g) => g.count));
  const total = groups.reduce((sum, g) => sum + g.count, 0);

  return (
    <Card>
      <CardHeader
        title={`${terms.groupPlural} bo'yicha ${terms.studentPlural.toLowerCase()}`}
        action={<span className="text-xs text-ink-faint">{total} ta</span>}
      />
      <div className="p-4">
        {groups.length === 0 ? (
          <EmptyState
            title={`Hali ${terms.group.toLowerCase()} yo'q`}
            hint={`${terms.groupPlural} qo'shilgach, har biridagi ${terms.student.toLowerCase()} soni shu yerda ko'rinadi.`}
          />
        ) : (
          <ul className="space-y-2.5">
            {groups.map((g) => (
              <li key={g.name} className="flex items-center gap-3">
                <span className="w-28 truncate text-sm text-ink-muted">
                  {g.name}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${(g.count / max) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-sm text-ink">{g.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

/** Bugungi davomat holati. */
export function TodayAttendance({
  present,
  late,
  absent,
  percent,
  terms,
}: {
  present: number;
  late: number;
  absent: number;
  percent: number;
  terms: SegmentTerms;
}) {
  const marked = present + late + absent;
  const rows: [string, number, string][] = [
    ["Vaqtida keldi", present, "bg-green-500"],
    ["Kechikdi", late, "bg-amber-500"],
    ["Qatnashmadi", absent, "bg-red-500"],
  ];

  return (
    <Card>
      <CardHeader title="Bugungi davomat" />
      <div className="p-4">
        {marked === 0 ? (
          <EmptyState
            title="Bugun davomat belgilanmagan"
            hint={`Davomat sahifasida belgilangach, ${terms.studentPlural.toLowerCase()} statistikasi shu yerda ko'rinadi.`}
          />
        ) : (
          <>
            <div className="mb-4 text-3xl font-semibold text-ink">{percent}%</div>
            <ul className="space-y-2.5">
              {rows.map(([label, count, color]) => (
                <li key={label} className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${color}`} />
                  <span className="flex-1 text-sm text-ink-muted">{label}</span>
                  <span className="text-sm font-medium text-ink">{count} ta</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Card>
  );
}

/** Tezkor amallar. */
export function QuickActions({ terms }: { terms: SegmentTerms }) {
  const actions = [
    {
      href: "/students/new",
      icon: UserPlus,
      title: terms.newStudent,
      hint: "Qabul qilish",
    },
    { href: "/groups", icon: BookOpen, title: terms.newGroup, hint: "Ochish" },
    {
      href: "/payments",
      icon: Wallet,
      title: "To'lov",
      hint: "Tushumni kiritish",
    },
    {
      href: "/attendance",
      icon: CalendarCheck,
      title: "Davomat",
      hint: "Belgilash",
    },
  ];

  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
        Tezkor amallar
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href + a.title}
              href={a.href}
              className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-sm transition-colors hover:bg-canvas"
            >
              <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                <Icon size={18} />
              </div>
              <div>
                <div className="text-sm font-medium text-ink">{a.title}</div>
                <div className="text-xs text-ink-faint">{a.hint}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
