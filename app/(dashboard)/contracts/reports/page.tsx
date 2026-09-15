import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"Shartnomalar hisoboti"}
      subtitle={"Hisobotlar"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Davr", cell: () => null },
          { header: "Shartnomalar soni", cell: () => null },
          { header: "Umumiy summa", cell: () => null },
          { header: "To'langan", cell: () => null },
          { header: "Qarzdorlik", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
