// TODO: 6-bosqich — o'quvchi kartochkasi + balans tarixi.
export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return <h1 className="text-xl">O&apos;quvchi: {studentId}</h1>;
}
