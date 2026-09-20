import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { ListPageShell } from "@/components/ui/ListPage";
import { CreateCenterForm } from "@/components/platform/CreateCenterForm";

/** Yangi o'quv markazni super admin ochadi — mijoz o'zi ro'yxatdan o'tmaydi. */
export default async function NewCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ requestId?: string; center?: string; director?: string; phone?: string }>;
}) {
  await requirePlatformAdmin();
  // "Arizalar" bo'limidan kelganda forma ariza ma'lumotlari bilan to'ldiriladi.
  const q = await searchParams;

  return (
    <ListPageShell
      title="Yangi o'quv markaz"
      subtitle="Markaz nomi, rahbar va telefon yetarli — subdomenni keyin belgilaysiz"
    >
      <CreateCenterForm
        initial={{
          requestId: q.requestId,
          orgName: q.center,
          directorName: q.director,
          phone: q.phone ? `+${q.phone.replace(/\D/g, "")}` : undefined,
        }}
      />
    </ListPageShell>
  );
}
