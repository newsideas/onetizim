import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { ListPageShell } from "@/components/ui/ListPage";
import { ReferenceManager, type RefOption } from "@/components/settings/ReferenceManager";
import {
  REFERENCE_KEYS,
  getReference,
  isReferenceKey,
  referencePath,
  type ReferenceKey,
} from "@/lib/references";

export default async function ReferencePage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  if (!isReferenceKey(key)) notFound();

  const config = getReference(key);
  if (config.group === "hidden") notFound();
  const { supabase } = await requirePermission("settings.manage");

  const linkedKeys = [
    ...new Set(config.fields.flatMap((f) => (f.ref ? [f.ref] : []))),
  ];

  const [{ data: rows, error }, ...linked] = await Promise.all([
    supabase
      .from(config.table)
      .select("*")
      .order(config.orderBy.column, { ascending: config.orderBy.ascending }),
    ...linkedKeys.map((ref) => {
      const target = getReference(ref);
      return supabase
        .from(target.table)
        .select(`id, ${target.labelField}`)
        .order(target.labelField);
    }),
  ]);

  const refOptions: Record<string, RefOption[]> = {};
  linkedKeys.forEach((ref, i) => {
    const labelField = getReference(ref).labelField;
    const data = (linked[i].data ?? []) as unknown as Record<string, unknown>[];
    refOptions[ref] = data.map((row) => ({
      id: String(row.id),
      label: String(row[labelField] ?? ""),
    }));
  });

  return (
    <ListPageShell
      title={config.title}
      subtitle={config.subtitle}
      notice={
        error
          ? "Bu ro'yxat jadvali bazada topilmadi — yangi migratsiyalarni (yangi-migratsiyalar.sql) Supabase SQL Editor'da ishga tushiring."
          : undefined
      }
    >
      <ReferenceNav current={key} group={config.group} />
      <ReferenceManager
        key={key}
        refKey={key}
        config={config}
        rows={rows ?? []}
        refOptions={refOptions}
      />
    </ListPageShell>
  );
}

function ReferenceNav({ current, group }: { current: ReferenceKey; group?: string }) {
  return (
    <nav aria-label="Ma'lumotnomalar" className="flex flex-wrap gap-1.5">
      {REFERENCE_KEYS.filter((key) => getReference(key).group === group).map((key) => {
        const active = key === current;
        return (
          <Link
            key={key}
            href={referencePath(key)}
            aria-current={active ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-line bg-surface text-ink-muted hover:border-brand-500 hover:text-brand-600"
            }`}
          >
            {getReference(key).title}
          </Link>
        );
      })}
    </nav>
  );
}
