import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"Yo'riqnoma"}
      subtitle={"Davomat tizimi yo'riqnomasi"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Bo'lim", cell: () => null },
          { header: "Tavsif", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
