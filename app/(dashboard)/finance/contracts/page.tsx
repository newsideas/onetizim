import Link from "next/link";
import { FileText } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { termsFor } from "@/lib/segment";
import { formatDate } from "@/lib/utils/date";
import { formatSom } from "@/lib/utils/currency";
import type { ContractStatus } from "@/lib/validations/contract";
import { ListPageShell, DataTable, type Column } from "@/components/ui/ListPage";
import { FilterBar } from "@/components/ui/FilterBar";
import { PageTabs } from "@/components/ui/PageTabs";
import {
  ContractsProvider,
  NewContractButton,
  type ContractFormOptions,
  type EditableContract,
} from "@/components/contracts/ContractsProvider";
import { ContractActions } from "@/components/contracts/ContractActions";

interface ContractRow extends EditableContract {
  discount_amount: number;
  amount: number;
  created_at: string;
  student: {
    full_name: string;
    parent_full_name: string | null;
    parent_relation: string | null;
    group: { name: string } | null;
  };
  contract_type: { name: string } | null;
  academic_year: { name: string } | null;
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

export default async function ContractAssignPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const status: ContractStatus = params.status === "cancelled" ? "cancelled" : "active";

  const { supabase, org } = await requirePermission("contracts.manage");
  const terms = termsFor(org.type);

  let query = supabase
    .from("contracts")
    .select(
      "id, student_id, contract_number, contract_type_id, academic_year_id, discount_id, base_amount, discount_amount, amount, file_path, file_name, created_at, student:students!inner(full_name, parent_full_name, parent_relation, group:groups(name)), contract_type:contract_types(name), academic_year:academic_years(name)",
    )
    .eq("status", status)
    .order("created_at", { ascending: false });

  const q = params.q?.trim();
  if (q) query = query.ilike("student.full_name", `%${escapeLike(q)}%`);
  if (params.academic_year) query = query.eq("academic_year_id", params.academic_year);
  if (params.contract_type) query = query.eq("contract_type_id", params.contract_type);

  const countFor = (s: ContractStatus) =>
    supabase.from("contracts").select("id", { count: "exact", head: true }).eq("status", s);

  const [
    contractsResult,
    activeCount,
    cancelledCount,
    { data: students },
    { data: contractTypes },
    { data: academicYears },
    { data: discounts },
    { data: amountPresets },
  ] = await Promise.all([
    query,
    countFor("active"),
    countFor("cancelled"),
    supabase
      .from("students")
      .select("id, full_name, group:groups(name)")
      .neq("status", "archived")
      .order("full_name"),
    supabase.from("contract_types").select("id, name").order("name"),
    supabase.from("academic_years").select("id, name").order("name", { ascending: false }),
    supabase.from("contract_discounts").select("id, name, discount_type, amount").order("name"),
    supabase.from("contract_amounts").select("id, name, amount, academic_year_id").order("name"),
  ]);

  const rows = (contractsResult.data ?? []) as unknown as ContractRow[];

  const options: ContractFormOptions = {
    orgId: org.id,
    students: (students ?? []).map((s) => {
      const group = (s.group as unknown as { name: string } | null)?.name;
      return { id: s.id, label: group ? `${s.full_name} — ${group}` : s.full_name };
    }),
    contractTypes: (contractTypes ?? []).map((t) => ({ id: t.id, label: t.name })),
    academicYears: (academicYears ?? []).map((y) => ({ id: y.id, label: y.name })),
    discounts: (discounts ?? []).map((d) => ({
      id: d.id,
      label: `${d.name} (${d.discount_type === "fixed" ? formatSom(Number(d.amount)) : `${d.amount}%`})`,
      discount_type: d.discount_type,
      amount: Number(d.amount),
    })),
    amountPresets: (amountPresets ?? []).map((p) => ({
      id: p.id,
      label: p.name,
      amount: Number(p.amount),
      academic_year_id: p.academic_year_id,
    })),
  };

  const tabHref = (s: ContractStatus) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && key !== "status") next.set(key, value);
    }
    if (s === "cancelled") next.set("status", s);
    const qs = next.toString();
    return qs ? `/finance/contracts?${qs}` : "/finance/contracts";
  };

  const columns: Column<ContractRow>[] = [
    {
      header: "FISH",
      cell: (row) => (
        <Link href={`/education/students/${row.student_id}`} className="font-medium text-ink hover:text-brand-600">
          {row.student.full_name}
        </Link>
      ),
    },
    {
      header: "Ota-ona / vasiy",
      cell: (row) =>
        row.student.parent_full_name
          ? `${row.student.parent_full_name}${row.student.parent_relation ? ` (${row.student.parent_relation})` : ""}`
          : "—",
    },
    { header: terms.group, cell: (row) => row.student.group?.name ?? "—" },
    { header: "O'quv yili", cell: (row) => row.academic_year?.name ?? "—" },
    {
      header: "Shartnoma",
      cell: (row) =>
        row.contract_number || row.contract_type ? (
          <div>
            <div className="font-medium">{row.contract_number ? `№ ${row.contract_number}` : "—"}</div>
            {row.contract_type && <div className="text-xs text-ink-faint">{row.contract_type.name}</div>}
          </div>
        ) : (
          "—"
        ),
    },
    {
      header: "Shartnoma summasi",
      align: "right",
      cell: (row) => (
        <div className="whitespace-nowrap">
          <div className="font-medium">{formatSom(Number(row.amount))}</div>
          {Number(row.discount_amount) > 0 && (
            <div className="text-xs text-ink-faint line-through">{formatSom(Number(row.base_amount))}</div>
          )}
        </div>
      ),
    },
    {
      header: "Shartnoma fayli",
      cell: (row) =>
        row.file_path ? (
          <a
            href={`/api/contracts/${row.id}/file`}
            target="_blank"
            rel="noopener noreferrer"
            title={row.file_name ?? undefined}
            className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700"
          >
            <FileText size={15} />
            Ko&apos;rish
          </a>
        ) : (
          "—"
        ),
    },
    { header: "Yaratilgan sana", cell: (row) => formatDate(row.created_at) },
  ];

  return (
    <ContractsProvider options={options}>
      <ListPageShell
        title="Shartnoma belgilash"
        subtitle="Shartnomalar ro'yxati"
        actions={<NewContractButton />}
        notice={
          contractsResult.error
            ? "Shartnomalar jadvali bazada topilmadi — 0013, 0014 va 0015 migratsiyalarini Supabase SQL Editor'da ishga tushiring."
            : undefined
        }
        tabs={
          <PageTabs
            tabs={[
              {
                label: "Faol",
                href: tabHref("active"),
                active: status === "active",
                count: activeCount.count ?? 0,
              },
              {
                label: "Bekor qilingan",
                href: tabHref("cancelled"),
                active: status === "cancelled",
                count: cancelledCount.count ?? 0,
              },
            ]}
          />
        }
        filters={
          <FilterBar
            action="/finance/contracts"
            values={params}
            fields={[
              { name: "q", label: "FISH", placeholder: `${terms.student} ismi` },
              {
                name: "academic_year",
                label: "O'quv yili",
                options: options.academicYears.map((y) => ({ value: y.id, label: y.label })),
              },
              {
                name: "contract_type",
                label: "Shartnoma turi",
                options: options.contractTypes.map((t) => ({ value: t.id, label: t.label })),
              },
            ]}
          />
        }
      >
        <DataTable
          rows={rows}
          columns={columns}
          rowActions={(row) => (
            <ContractActions
              status={status}
              contract={{
                id: row.id,
                student_id: row.student_id,
                contract_number: row.contract_number,
                contract_type_id: row.contract_type_id,
                academic_year_id: row.academic_year_id,
                discount_id: row.discount_id,
                base_amount: Number(row.base_amount),
                file_path: row.file_path,
                file_name: row.file_name,
              }}
            />
          )}
        />
      </ListPageShell>
    </ContractsProvider>
  );
}
