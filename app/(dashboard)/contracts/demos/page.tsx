import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"Shartnoma shablonlari"}
      subtitle={"Shablonlar ro'yxati"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Nomi", cell: () => null },
          { header: "Turi", cell: () => null },
          { header: "Fayl", cell: () => null },
          { header: "Yaratilgan sana", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
