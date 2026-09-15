import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"O'quv yillari"}
      subtitle={"O'quv yillari ro'yxati"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "O'quv yili", cell: () => null },
          { header: "Ta'lim turi", cell: () => null },
          { header: "Boshlanish sanasi", cell: () => null },
          { header: "Tugash sanasi", cell: () => null },
          { header: "Joriy o'quv yili", cell: () => null },
          { header: "Yaratilgan sana", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
