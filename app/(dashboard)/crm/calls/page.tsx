import { ListPageShell, DataTable } from "@/components/ui/ListPage";

export default async function Page() {
  return (
    <ListPageShell
      title={"Qo'ng'iroqlar"}
      subtitle={"Qo'ng'iroqlar ro'yxati"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "Telefon", cell: () => null },
          { header: "Yo'nalish", cell: () => null },
          { header: "Davomiyligi", cell: () => null },
          { header: "Xodim", cell: () => null },
          { header: "Natija", cell: () => null },
          { header: "Sana", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
