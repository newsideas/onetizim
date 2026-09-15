import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"Xarajatlar"}
      subtitle={"Xarajatlar menyusi"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Tranzaksiya raqami", cell: () => null },
          { header: "Davr", cell: () => null },
          { header: "Umumiy xarajat", cell: () => null },
          { header: "Aniqlanganlar", cell: () => null },
          { header: "Aniqlanmaganlar", cell: () => null },
          { header: "Biriktirgan foydalanuvchi", cell: () => null },
          { header: "Oxirgi yangilanish", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
