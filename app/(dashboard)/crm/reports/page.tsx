import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"CRM hisobotlari"}
      subtitle={"Hisobotlar"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Davr", cell: () => null },
          { header: "Yangi lidlar", cell: () => null },
          { header: "Aylantirilgan", cell: () => null },
          { header: "Yo'qotilgan", cell: () => null },
          { header: "Konversiya", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
