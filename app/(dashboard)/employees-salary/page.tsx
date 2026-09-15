import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"Xodimlar maoshi"}
      subtitle={"Maosh ro'yxati"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "FISH", cell: () => null },
          { header: "Lavozim", cell: () => null },
          { header: "Maosh turi", cell: () => null },
          { header: "Miqdori", cell: () => null },
          { header: "Davr", cell: () => null },
          { header: "Holati", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
