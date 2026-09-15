import { ListPageShell, DataTable } from "@/components/ui/ListPage";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/supabase/getCurrentOrg";
import { termsFor } from "@/lib/segment";

export default async function Page() {
  const supabase = await createClient();
  const terms = termsFor((await getCurrentOrg(supabase)).type);

  return (
    <ListPageShell
      title={"Ota-onalar"}
      subtitle={"Ota-onalar ro'yxati"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "FISH", cell: () => null },
          { header: "Telefon", cell: () => null },
          { header: `${terms.student}`, cell: () => null },
          { header: "Telegram", cell: () => null },
          { header: "Yaratilgan sana", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
