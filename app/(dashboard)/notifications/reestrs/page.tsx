import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"SMS reestrlari"}
      subtitle={"Reestrlar ro'yxati"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Reestr raqami", cell: () => null },
          { header: "Xabarlar soni", cell: () => null },
          { header: "Yuborilgan", cell: () => null },
          { header: "Yetkazilgan", cell: () => null },
          { header: "Sana", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
