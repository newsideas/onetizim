import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"Balans"}
      subtitle={"Obuna va balans"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Tarif", cell: () => null },
          { header: "Davr", cell: () => null },
          { header: "Summa", cell: () => null },
          { header: "Holati", cell: () => null },
          { header: "Sana", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
