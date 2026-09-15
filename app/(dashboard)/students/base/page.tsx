import { ListPageShell, DataTable } from "@/components/ui/ListPage";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/supabase/getCurrentOrg";
import { termsFor } from "@/lib/segment";

export default async function Page() {
  const supabase = await createClient();
  const terms = termsFor((await getCurrentOrg(supabase)).type);

  return (
    <ListPageShell
      title={`${terms.studentPlural} bazasi`}
      subtitle={`${terms.studentPlural} bazasi ro'yxati`}
      notice={"Bu bo\u2019lim qurilmoqda \u2014 hozircha ma\u2019lumot saqlanmaydi."}
    >
      <DataTable
        rows={[]}
        columns={[
          { header: "FISH", cell: () => null },
          { header: "Tug'ilgan sana", cell: () => null },
          { header: "Pasport / guvohnoma", cell: () => null },
          { header: "Qabul qilingan yili", cell: () => null },
          { header: "Ota-ona / vasiy", cell: () => null },
          { header: "Hudud", cell: () => null },
          { header: "Yaratilgan sana", cell: () => null },
        ]}
      />
    </ListPageShell>
  );
}
