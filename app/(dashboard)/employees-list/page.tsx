import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"Xodimlar"}
      subtitle={"Xodimlar ro'yxati"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "FISH", cell: () => null },
          { header: "Foydalanuvchi roli", cell: () => null },
          { header: "Lavozim", cell: () => null },
          { header: "Telefon", cell: () => null },
          { header: "Holati", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
