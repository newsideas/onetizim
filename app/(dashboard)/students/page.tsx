import { createClient } from "@/lib/supabase/server";
import { StudentsTable, type StudentTableRow } from "@/components/students/StudentsTable";
import { NewStudentButton } from "@/components/students/NewStudentButton";

export default async function StudentsPage() {
  const supabase = await createClient();

  const [{ data: students }, { data: groups }] = await Promise.all([
    supabase
      .from("students")
      .select("*, group:groups(name)")
      .order("created_at", { ascending: false }),
    supabase.from("groups").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">O&apos;quvchilar</h1>
        <NewStudentButton groups={groups ?? []} />
      </div>
      <StudentsTable students={(students as StudentTableRow[]) ?? []} />
    </div>
  );
}
