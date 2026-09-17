import { StudentsTabs } from "@/components/education/SectionTabs";
import { requirePermission } from "@/lib/auth/session";
import { StudentsTable, type StudentTableRow } from "@/components/students/StudentsTable";
import { NewStudentButton } from "@/components/students/NewStudentButton";
import { StudentsFilter } from "@/components/students/StudentsFilter";
import { termsFor } from "@/lib/segment";

const VALID_STATUSES = ["active", "frozen", "archived", "all"];

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status =
    params.status && VALID_STATUSES.includes(params.status) ? params.status : "active";

  const { supabase, org } = await requirePermission("students.view");

  const terms = termsFor(org.type);

  let studentsQuery = supabase
    .from("students")
    .select("*, group:groups(name)")
    .order("full_name");

  if (status !== "all") {
    studentsQuery = studentsQuery.eq("status", status);
  }

  const { data: students } = await studentsQuery;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">{terms.studentPlural}</h1>
        <NewStudentButton />
      </div>

      <StudentsTabs current="list" />

      <StudentsFilter current={status} />

      <StudentsTable
        students={(students as StudentTableRow[]) ?? []}
        emptyText={
          status === "active"
            ? `Hali aktiv ${terms.studentPlural.toLowerCase()} yo'q. "${terms.newStudent}" tugmasi orqali qo'shing.`
            : `Bu holatda ${terms.student.toLowerCase()} yo'q.`
        }
        groupLabel={terms.group}
      />
    </div>
  );
}
