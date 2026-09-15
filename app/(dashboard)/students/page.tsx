import { createClient } from "@/lib/supabase/server";
import { StudentsTable, type StudentTableRow } from "@/components/students/StudentsTable";
import { NewStudentButton } from "@/components/students/NewStudentButton";
import { StudentsFilter } from "@/components/students/StudentsFilter";
import { getCurrentOrg } from "@/lib/supabase/getCurrentOrg";
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

  const supabase = await createClient();

  const terms = termsFor((await getCurrentOrg(supabase)).type);

  let studentsQuery = supabase
    .from("students")
    .select("*, group:groups(name)")
    .order("full_name");

  if (status !== "all") {
    studentsQuery = studentsQuery.eq("status", status);
  }

  const [{ data: students }, { data: groups }] = await Promise.all([
    studentsQuery,
    supabase.from("groups").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">{terms.studentPlural}</h1>
        <NewStudentButton groups={groups ?? []} />
      </div>

      <StudentsFilter current={status} />

      <StudentsTable
        students={(students as StudentTableRow[]) ?? []}
        emptyText={
          status === "active"
            ? "Hali aktiv o'quvchilar yo'q. \"Yangi o'quvchi\" tugmasi orqali qo'shing."
            : "Bu holatda o'quvchi yo'q."
        }
      />
    </div>
  );
}
