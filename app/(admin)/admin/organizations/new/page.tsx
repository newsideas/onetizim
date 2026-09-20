import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { ListPageShell } from "@/components/ui/ListPage";
import { CreateCenterForm } from "@/components/platform/CreateCenterForm";

/** Yangi o'quv markazni super admin ochadi — mijoz o'zi ro'yxatdan o'tmaydi. */
export default async function NewCenterPage() {
  await requirePlatformAdmin();

  return (
    <ListPageShell
      title="Yangi o'quv markaz"
      subtitle="Markaz nomi, rahbar va telefon yetarli — subdomenni keyin belgilaysiz"
    >
      <CreateCenterForm />
    </ListPageShell>
  );
}
