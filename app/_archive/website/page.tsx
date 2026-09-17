import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"Veb sayt"}
      subtitle={"Veb sayt sozlamalari"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Bo'lim", cell: () => null },
          { header: "Holati", cell: () => null },
          { header: "Oxirgi yangilanish", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
