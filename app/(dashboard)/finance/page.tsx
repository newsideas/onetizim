import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"Kategoriyalar hisoboti"}
      subtitle={"Moliyaviy hisobot"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Kategoriya", cell: () => null },
          { header: "Turi", cell: () => null },
          { header: "Summa", cell: () => null },
          { header: "Ulush", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
