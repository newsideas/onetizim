import { StudentList, type StudentView } from "@/components/students/StudentList";

/**
 * Ko'rinish URL'dan aniqlanadi: ?view=new — yangi, ?status=archived — arxiv,
 * ?status=frozen/all — to'liq baza (filtrlangan), aks holda aktiv o'quvchilar.
 */
function resolveView(params: Record<string, string | undefined>): {
  view: StudentView;
  params: Record<string, string | undefined>;
} {
  if (params.view === "new") return { view: "new", params };
  if (params.status === "archived") return { view: "archived", params };
  if (params.status === "frozen") return { view: "all", params };
  if (params.status === "all") return { view: "all", params: { ...params, status: undefined } };
  return { view: "active", params };
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { view, params } = resolveView(await searchParams);
  return <StudentList view={view} params={params} />;
}
