import { ListPageShell, DataTable } from "@/components/ui/ListPage";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/supabase/getCurrentOrg";
import { termsFor } from "@/lib/segment";

export default async function Page() {
  const supabase = await createClient();
  const terms = termsFor((await getCurrentOrg(supabase)).type);

  return (
    <ListPageShell
      title={"O'quv bo'limi hisobotlari"}
      subtitle={"Hisobotlar"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: `${terms.group}`, cell: () => null },
          { header: "Fan", cell: () => null },
          { header: `${terms.teacher}`, cell: () => null },
          { header: "Darslar soni", cell: () => null },
          { header: "O'zlashtirish", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
