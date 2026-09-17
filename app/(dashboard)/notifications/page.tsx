import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"Xabarlar"}
      subtitle={"Xabarlar ro'yxati"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Qabul qiluvchi", cell: () => null },
          { header: "Matn", cell: () => null },
          { header: "Kanal", cell: () => null },
          { header: "Holati", cell: () => null },
          { header: "Yuborilgan sana", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
