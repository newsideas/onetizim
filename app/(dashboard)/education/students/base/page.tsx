import { StudentsTabs } from "@/components/education/SectionTabs";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ListPageShell, DataTable, type Column } from "@/components/ui/ListPage";
import { FilterBar } from "@/components/ui/FilterBar";
import { NewStudentButton } from "@/components/students/NewStudentButton";
import { getCurrentOrg } from "@/lib/supabase/getCurrentOrg";
import { termsFor } from "@/lib/segment";
import { formatDate } from "@/lib/utils/date";
import { GENDER_LABELS } from "@/lib/validations/student";

interface StudentBaseRow {
  id: string;
  full_name: string;
  birth_date: string | null;
  passport_number: string | null;
  birth_cert_series: string | null;
  birth_cert_number: string | null;
  parent_full_name: string | null;
  parent_relation: string | null;
  region: string | null;
  district: string | null;
  gender: string | null;
  nationality: string | null;
  status: string;
  created_at: string;
  group: { name: string } | null;
}

/**
 * O'quvchilar bazasi — My School'dagi eng to'liq ro'yxat: hujjat
 * ma'lumotlari (pasport/guvohnoma), ota-ona va hudud bilan birga.
 * "O'quvchilar" (`/education/students`) esa kundalik ishlash uchun qisqa
 * ko'rinish — balans va holat ko'proq kerak bo'lganda o'sha yerga
 * boriladi.
 */
export default async function StudentsBasePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const terms = termsFor((await getCurrentOrg(supabase)).type);

  let query = supabase
    .from("students")
    .select(
      "id, full_name, birth_date, passport_number, birth_cert_series, birth_cert_number, parent_full_name, parent_relation, region, district, gender, nationality, status, created_at, group:groups(name)",
    )
    .order("full_name");

  if (params.region) query = query.eq("region", params.region);
  if (params.district) query = query.eq("district", params.district);
  if (params.gender) query = query.eq("gender", params.gender);
  if (params.status) query = query.eq("status", params.status);

  const { data } = await query;
  const rows = (data ?? []) as unknown as StudentBaseRow[];

  const columns: Column<StudentBaseRow>[] = [
    {
      header: "FISH",
      cell: (row) => (
        <Link
          href={`/education/students/${row.id}`}
          className="font-medium text-ink hover:text-brand-600"
        >
          {row.full_name}
        </Link>
      ),
    },
    {
      header: "Tug'ilgan sana",
      cell: (row) => (row.birth_date ? formatDate(row.birth_date) : "—"),
    },
    {
      header: "Pasport / guvohnoma",
      cell: (row) =>
        row.passport_number ||
        (row.birth_cert_series || row.birth_cert_number
          ? `${row.birth_cert_series ?? ""} ${row.birth_cert_number ?? ""}`.trim()
          : "—"),
    },
    {
      header: "Ota-ona / vasiy",
      cell: (row) =>
        row.parent_full_name
          ? `${row.parent_full_name}${row.parent_relation ? ` (${row.parent_relation})` : ""}`
          : "—",
    },
    {
      header: "Hudud",
      cell: (row) =>
        [row.region, row.district].filter(Boolean).join(", ") || "—",
    },
    {
      header: "Yaratilgan sana",
      cell: (row) => formatDate(row.created_at),
    },
  ];

  return (
    <ListPageShell
      title={`${terms.studentPlural} bazasi`}
      subtitle={`${terms.studentPlural} bazasi ro'yxati`}
      actions={<NewStudentButton />}
      tabs={<StudentsTabs current="base" />}
      filters={
        <FilterBar
          action="/education/students/base"
          values={params}
          fields={[
            { name: "region", label: "Viloyat" },
            { name: "district", label: "Tuman" },
            {
              name: "gender",
              label: "Jinsi",
              options: Object.entries(GENDER_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            },
            {
              name: "status",
              label: "Holati",
              options: [
                { value: "active", label: "Faol" },
                { value: "frozen", label: "Muzlatilgan" },
                { value: "archived", label: "Arxiv" },
              ],
            },
          ]}
        />
      }
    >
      <DataTable rows={rows} columns={columns} />
    </ListPageShell>
  );
}
