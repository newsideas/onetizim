import { ListPageShell, DataTable } from "@/components/ui/ListPage";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/supabase/getCurrentOrg";
import { termsFor } from "@/lib/segment";

export default async function Page() {
  const supabase = await createClient();
  const terms = termsFor((await getCurrentOrg(supabase)).type);

  return (
    <ListPageShell
      title={"To'lov monitoringi"}
      subtitle={"To'lovlar nazorati"}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "FISH", cell: () => null },
          { header: `${terms.group}`, cell: () => null },
          { header: "Shartnoma summasi", cell: () => null },
          { header: "To'langan", cell: () => null },
          { header: "Qarzdorlik", cell: () => null },
          { header: "To'lov foizi", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
