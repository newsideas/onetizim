import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"Vazifalar"}
      subtitle={"Vazifalar ro'yxati"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Vazifa", cell: () => null },
          { header: "Lid", cell: () => null },
          { header: "Mas'ul", cell: () => null },
          { header: "Muddat", cell: () => null },
          { header: "Holati", cell: () => null },
          { header: "Yaratilgan sana", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
