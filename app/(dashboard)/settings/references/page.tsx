import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { REFERENCE_KEYS, getReference, referencePath } from "@/lib/references";

/** Guruh nomlari (Sozlamalar bo'limlari). Guruhsiz ma'lumotnomalar — "Umumiy". */
const GROUP_TITLES: Record<string, string> = {
  general: "Umumiy",
  education: "O'quv",
  "block-test": "Blok test",
  finance: "Moliya",
  marketing: "Sotuv va marketing",
  management: "Boshqaruv",
  control: "Nazorat",
};

/**
 * Ma'lumotnomalar indeksi: hammasi yoki ?group=finance kabi bitta guruh.
 * Menyudagi Sozlamalar bandlari shu sahifaga guruh bilan keladi.
 */
export default async function ReferencesIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group } = await searchParams;
  await requirePermission("settings.manage");

  const keys = REFERENCE_KEYS.filter((key) => {
    const g = getReference(key).group ?? "general";
    if (g === "hidden") return false;
    return !group || g === group;
  });

  const sections = new Map<string, typeof keys>();
  for (const key of keys) {
    const g = getReference(key).group ?? "general";
    sections.set(g, [...(sections.get(g) ?? []), key]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">
          {group ? (GROUP_TITLES[group] ?? "Ma'lumotnomalar") : "Ma'lumotnomalar"}
        </h1>
        <p className="mt-0.5 text-sm text-ink-faint">Sozlamalar va ro&apos;yxatlar</p>
      </div>

      {keys.length === 0 && (
        <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
          Bu bo&apos;limda hali sozlama yo&apos;q.
        </div>
      )}

      {[...sections.entries()].map(([g, list]) => (
        <section key={g} className="space-y-2">
          {!group && (
            <h2 className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
              {GROUP_TITLES[g] ?? g}
            </h2>
          )}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((key) => {
              const config = getReference(key);
              return (
                <Link
                  key={key}
                  href={referencePath(key)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-md"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">{config.title}</div>
                    <div className="mt-0.5 truncate text-xs text-ink-faint">{config.subtitle}</div>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-ink-faint" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
