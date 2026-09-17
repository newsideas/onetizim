import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"Kassa hisoboti"}
      subtitle={"Hisobotlar"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Davr", cell: () => null },
          { header: "Kirim", cell: () => null },
          { header: "Chiqim", cell: () => null },
          { header: "Qoldiq", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
