import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { ContractTemplateForm } from "@/components/contracts/ContractTemplateForm";
import { getReference } from "@/lib/references";

interface TemplateRow {
  number: string | null;
  title: string;
  type_id: string | null;
  body: string | null;
}

/** Shartnoma shablonini tahrirlash. */
export default async function EditContractTemplatePage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  const { supabase } = await requirePermission("settings.manage");

  const [rowRes, typesRes] = await Promise.all([
    supabase
      .from(getReference("contract-templates").table)
      .select("number, title, type_id, body")
      .eq("id", templateId)
      .maybeSingle(),
    supabase.from(getReference("contract-types").table).select("id, name").order("name"),
  ]);
  const row = rowRes.data as TemplateRow | null;
  if (!row) notFound();

  return (
    <ContractTemplateForm
      templateId={templateId}
      types={(typesRes.data ?? []) as { id: string; name: string }[]}
      initial={{ number: row.number ?? "", title: row.title, typeId: row.type_id ?? "", body: row.body ?? "" }}
    />
  );
}
