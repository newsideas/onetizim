import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"Dars vaqtlari"}
      subtitle={"Dars vaqtlari ro'yxati"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Tartib raqami", cell: () => null },
          { header: "Boshlanishi", cell: () => null },
          { header: "Tugashi", cell: () => null },
          { header: "Smena", cell: () => null },
          { header: "Yaratilgan sana", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
