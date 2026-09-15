import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/supabase/getCurrentOrg";
import { termsFor } from "@/lib/segment";
import { StudentForm } from "@/components/students/StudentForm";
import { FormPageHeader } from "@/components/ui/FormLayout";
import { Card, EmptyState } from "@/components/ui/Card";

export default async function NewStudentPage() {
  const supabase = await createClient();
  const terms = termsFor((await getCurrentOrg(supabase)).type);

  const { data: groups } = await supabase
    .from("groups")
    .select("id, name")
    .order("name");

  const hasGroups = (groups ?? []).length > 0;

  return (
    <div className="space-y-4">
      <FormPageHeader
        title={terms.studentPlural}
        breadcrumb={`${terms.studentPlural} bazasi ro'yxati › Qo'shish`}
        backHref="/students/list"
      />

      <Card className="p-5">
        {hasGroups ? (
          <StudentForm groups={groups ?? []} />
        ) : (
          <EmptyState
            title={`Avval kamida bitta ${terms.group.toLowerCase()} yarating`}
            hint={`${terms.groupPlural} sahifasida qo'shganingizdan so'ng ${terms.student.toLowerCase()} qo'shish mumkin bo'ladi.`}
          />
        )}
      </Card>
    </div>
  );
}
