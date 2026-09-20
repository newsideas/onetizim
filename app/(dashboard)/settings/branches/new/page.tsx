import { requirePermission } from "@/lib/auth/session";
import { BranchForm } from "@/components/settings/BranchForm";

/** Yangi filial (Edu tizimdagi "Filial qo'shish" sahifasi). */
export default async function NewBranchPage() {
  await requirePermission("settings.manage");
  return <BranchForm />;
}
