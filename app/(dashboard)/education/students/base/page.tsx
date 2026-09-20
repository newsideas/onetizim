import { StudentList } from "@/components/students/StudentList";

/** «O'quvchilar ro'yxati» — barcha holatdagi o'quvchilarning to'liq bazasi. */
export default async function StudentsBasePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <StudentList view="all" params={await searchParams} />;
}
