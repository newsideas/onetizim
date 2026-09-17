import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"Tushumlar kategoriyasi"}
      subtitle={"Kategoriyalar ro'yxati"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Nomi", cell: () => null },
          { header: "Ota kategoriya", cell: () => null },
          { header: "Izoh", cell: () => null },
          { header: "Yaratilgan sana", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
