import { requirePermission } from "@/lib/auth/session";
import { ContractTemplateForm } from "@/components/contracts/ContractTemplateForm";
import { getReference } from "@/lib/references";

/** Yangi shartnoma shabloni (Edu tizimdagi "Shartnoma yaratish" sahifasi). */
export default async function NewContractTemplatePage() {
  const { supabase } = await requirePermission("settings.manage");
  const { data } = await supabase.from(getReference("contract-types").table).select("id, name").order("name");

  return <ContractTemplateForm types={(data ?? []) as { id: string; name: string }[]} />;
}
