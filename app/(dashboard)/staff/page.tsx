import { requirePermission } from "@/lib/auth/session";
import { ListPageShell } from "@/components/ui/ListPage";
import { StaffTabs } from "@/components/staff/StaffTabs";
import { TeachersProvider, NewTeacherButton, type TeacherRow } from "@/components/staff/TeachersProvider";
import { TeachersTable } from "@/components/staff/TeachersTable";

export default async function StaffPage() {
  const { supabase } = await requirePermission("staff.manage");

  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .order("is_active", { ascending: false })
    .order("full_name");

  return (
    <TeachersProvider>
      <ListPageShell
        title="Xodimlar"
        subtitle="O'qituvchi, menejer va ma'muriyat ro'yxati"
        actions={<NewTeacherButton />}
        tabs={<StaffTabs current="list" />}
        notice={
          error
            ? "Xodim kartasi ustunlari bazada topilmadi — 0016_org_members.sql migratsiyasini Supabase SQL Editor&apos;da ishga tushiring."
            : undefined
        }
      >
        <TeachersTable teachers={(data ?? []) as TeacherRow[]} />
      </ListPageShell>
    </TeachersProvider>
  );
}
