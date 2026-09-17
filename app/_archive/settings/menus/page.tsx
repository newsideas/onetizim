import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"Menyular"}
      subtitle={"Menyular ro'yxati"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Nomi", cell: () => null },
          { header: "Havola", cell: () => null },
          { header: "Tartib", cell: () => null },
          { header: "Holati", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
