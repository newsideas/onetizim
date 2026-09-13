// TODO: 5-bosqich — guruh detali: o'quvchilar, davomat, to'lov.
// Eslatma: Next.js 16'da `params` Promise, shuning uchun await qilinadi.
export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  return <h1 className="text-xl">Guruh: {groupId}</h1>;
}
