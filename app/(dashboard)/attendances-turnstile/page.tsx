import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"Turniket sozlamalari"}
      subtitle={"Turniket qurilmalari"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Qurilma nomi", cell: () => null },
          { header: "IP manzil", cell: () => null },
          { header: "Joylashuvi", cell: () => null },
          { header: "Holati", cell: () => null },
          { header: "Oxirgi aloqa", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
