import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"SMS sozlamalari"}
      subtitle={"Provayder sozlamalari"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Provayder", cell: () => null },
          { header: "Login", cell: () => null },
          { header: "Alfa nomi", cell: () => null },
          { header: "Holati", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
