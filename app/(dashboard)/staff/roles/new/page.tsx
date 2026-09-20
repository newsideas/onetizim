import { requirePermission } from "@/lib/auth/session";
import { ListPageShell } from "@/components/ui/ListPage";
import { RoleEditor } from "@/components/staff/RoleEditor";

/** Yangi rol: nom, izoh va bo'limlar bo'yicha ruxsatlar (Edu tizimdagi "Rol qo'shish"). */
export default async function NewRolePage() {
  await requirePermission("roles.manage");
  return (
    <ListPageShell title="Rol qo'shish" subtitle="Rol nomi va ruxsatlarni belgilang">
      <RoleEditor initial={null} />
    </ListPageShell>
  );
}
