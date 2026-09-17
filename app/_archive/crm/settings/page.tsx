import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"CRM sozlamalari"}
      subtitle={"Bosqichlar va manbalar"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Nomi", cell: () => null },
          { header: "Turi", cell: () => null },
          { header: "Tartib", cell: () => null },
          { header: "Yaratilgan sana", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
