import { ListPageShell, DataTable } from "@/components/ui/ListPage";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/supabase/getCurrentOrg";
import { termsFor } from "@/lib/segment";

export default async function Page() {
  const supabase = await createClient();
  const terms = termsFor((await getCurrentOrg(supabase)).type);

  return (
    <ListPageShell
      title={`${terms.group}ni o'zgartirish`}
      subtitle={`${terms.group}ni ko'chirish`}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "FISH", cell: () => null },
          { header: `Joriy ${terms.group.toLowerCase()}`, cell: () => null },
          { header: `Yangi ${terms.group.toLowerCase()}`, cell: () => null },
          { header: "O'quv yili", cell: () => null },
          { header: "Sana", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
