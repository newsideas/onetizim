import Link from "next/link";
import { Inbox } from "lucide-react";
import { BalanceBadge } from "@/components/payments/BalanceBadge";
import { InlineFilters, TablePager } from "@/components/ui/ListToolbar";
import { readPaging } from "@/lib/paging";
import { todayIso } from "@/lib/utils/date";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReactNode } from "react";

const TH = "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase";

interface ParentLink {
  parent: { full_name: string; relation: string | null; phone: string | null } | null;
}

interface StudentRow {
  id: string;
  full_name: string;
  balance: number;
  status: string;
  created_at: string;
  birth_date: string | null;
  group: { subject: string | null; teacher: { full_name: string } | null } | null;
  links: ParentLink[];
}

type Guardian = { full_name: string; phone: string | null };

/** Qarindoshlik matni bo'yicha ota / ona / boshqa vasiyni ajratadi. */
function classify(relation: string | null): "father" | "mother" | "other" {
  const r = (relation ?? "").trim().toLowerCase();
  if (/\bota\b|otasi|^dad|father/.test(r)) return "father";
  if (/\bona\b|onasi|^mom|mother/.test(r)) return "mother";
  return "other";
}

/**
 * Edu tizimdagi «Ota-ona» sahifasi: har qatorda o'quvchi, otasi, onasi va balans.
 * Ota-onani qo'shish/tahrirlash — «Ota-onalar» tabida.
 */
export async function ParentsByStudent({
  supabase,
  params,
  actions,
  tabs,
  studentLabel,
}: {
  supabase: SupabaseClient;
  params: Record<string, string | undefined>;
  actions?: ReactNode;
  tabs: ReactNode;
  studentLabel: string;
}) {
  const { data } = await supabase
    .from("students")
    .select(
      "id, full_name, balance, status, created_at, birth_date, group:groups(subject, teacher:teachers(full_name)), links:student_parents(parent:parents(full_name, relation, phone))",
    )
    .neq("status", "archived")
    .order("full_name");

  const q = params.q?.trim().toLowerCase();
  const today = todayIso();
  const all = (data ?? []) as unknown as StudentRow[];
  const subjects = [...new Set(all.map((s) => s.group?.subject).filter((v): v is string => Boolean(v)))];
  const teachers = [...new Set(all.map((s) => s.group?.teacher?.full_name).filter((v): v is string => Boolean(v)))];

  const rows = ((data ?? []) as unknown as StudentRow[])
    .map((s) => {
      const guardians = s.links.map((l) => l.parent).filter((p): p is NonNullable<typeof p> => !!p);
      const pick = (kind: "father" | "mother" | "other"): Guardian | null =>
        guardians.find((g) => classify(g.relation) === kind) ?? null;
      return { ...s, father: pick("father"), mother: pick("mother"), other: pick("other") };
    })
    .filter((s) => {
      if (params.link === "with" && !(s.father || s.mother || s.other)) return false;
      if (params.link === "without" && (s.father || s.mother || s.other)) return false;
      const balance = Number(s.balance);
      if (params.balance === "debt" && balance >= 0) return false;
      if (params.balance === "positive" && balance <= 0) return false;
      if (params.balance === "zero" && balance !== 0) return false;
      if (params.subject && s.group?.subject !== params.subject) return false;
      if (params.teacher && s.group?.teacher?.full_name !== params.teacher) return false;
      if (params.status && s.status !== params.status) return false;
      if (params.date && s.created_at.slice(0, 10) !== params.date) return false;
      if (params.birthday && !s.birth_date) return false;
      if (params.birthday === "today" && s.birth_date?.slice(5) !== today.slice(5)) return false;
      if (params.birthday === "month" && s.birth_date?.slice(5, 7) !== today.slice(5, 7)) return false;
      if (!q) return true;
      const text = [s.full_name, s.father?.full_name, s.mother?.full_name, s.other?.full_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });

  const { page, size } = readPaging(params);
  const current = Math.min(page, Math.max(1, Math.ceil(rows.length / size)));
  const offset = (current - 1) * size;
  const visible = rows.slice(offset, offset + size);

  return (
    <div className="space-y-3">
      {tabs}
      <InlineFilters
        storageKey="parents"
        configurable={false}
        actions={actions}
        fields={[
          { name: "q", label: "Qidiruv", type: "text" },
          {
            name: "link",
            label: "Ota-onasi",
            type: "select",
            options: [
              { value: "with", label: "Kiritilgan" },
              { value: "without", label: "Kiritilmagan" },
            ],
          },
          { name: "date", label: "Sana", type: "date", width: "w-40" },
          {
            name: "balance",
            label: "Balans",
            type: "select",
            options: [
              { value: "debt", label: "Qarzdor" },
              { value: "positive", label: "Balansi bor" },
              { value: "zero", label: "Balans nol" },
            ],
          },
          { name: "subject", label: "Kurs", type: "select", options: subjects.map((v) => ({ value: v, label: v })) },
          { name: "teacher", label: "O'qituvchi", type: "select", options: teachers.map((v) => ({ value: v, label: v })) },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "active", label: "Aktiv" },
              { value: "frozen", label: "Muzlatilgan" },
            ],
          },
          {
            name: "birthday",
            label: "Tug'ilgan kun",
            type: "select",
            options: [
              { value: "today", label: "Bugun" },
              { value: "month", label: "Shu oyda" },
            ],
          },
        ]}
      />

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex justify-end px-4 py-3">
          <span className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink-muted">
            Umumiy soni <b className="ml-1 text-ink">{rows.length}</b>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas">
              <tr>
                <th className={`${TH} w-12`}>№</th>
                <th className={TH}>ID</th>
                <th className={TH}>{studentLabel} ismi</th>
                <th className={TH}>Otasining ismi</th>
                <th className={TH}>Telefon raqam</th>
                <th className={TH}>Onasining ismi</th>
                <th className={TH}>Telefon raqam</th>
                <th className={TH}>Vasiy</th>
                <th className={TH}>Balans</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <Inbox size={22} className="mx-auto mb-2 text-ink-faint" aria-hidden="true" />
                    <div className="text-sm font-medium text-ink-muted">Ma&apos;lumotlar topilmadi</div>
                    <div className="mt-0.5 text-xs text-ink-faint">
                      Ma&apos;lumotlar topilmadi. Filterni o&apos;zgartirib ko&apos;ring.
                    </div>
                  </td>
                </tr>
              ) : (
                visible.map((s, i) => (
                  <tr key={s.id} className="hover:bg-canvas">
                    <td className="px-4 py-3 text-ink-faint">{offset + i + 1}</td>
                    <td className="px-4 py-3 text-ink-muted">{s.id.slice(0, 6).toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/education/students/${s.id}`}
                        className="font-medium text-ink hover:text-brand-600"
                      >
                        {s.full_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{s.father?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{s.father?.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">{s.mother?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{s.mother?.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {s.other ? `${s.other.full_name}${s.other.phone ? ` · ${s.other.phone}` : ""}` : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <BalanceBadge balance={Number(s.balance)} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePager total={rows.length} page={current} size={size} />
      </div>
    </div>
  );
}
