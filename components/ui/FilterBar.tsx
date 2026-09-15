import Link from "next/link";
import { Search, X } from "lucide-react";

export interface FilterField {
  /** URL query nomi. */
  name: string;
  label: string;
  /** Select bo'lsa variantlar; bo'lmasa oddiy matn maydoni. */
  options?: { value: string; label: string }[];
  placeholder?: string;
}

/**
 * Filtrlar paneli. Oddiy GET forma — qidiruv holati URL'da qoladi,
 * shuning uchun sahifani ulashsa ham, yangilasa ham saqlanadi va
 * server tomonda filtrlash mumkin bo'ladi.
 */
export function FilterBar({
  action,
  fields,
  values,
}: {
  /** Shu sahifaning yo'li — "Tozalash" shu yerga qaytaradi. */
  action: string;
  fields: FilterField[];
  values: Record<string, string | undefined>;
}) {
  return (
    <form
      method="get"
      action={action}
      className="rounded-xl border border-line bg-surface p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label
              htmlFor={field.name}
              className="mb-1.5 block text-xs font-medium text-ink-muted"
            >
              {field.label}
            </label>

            {field.options ? (
              <select
                id={field.name}
                name={field.name}
                defaultValue={values[field.name] ?? ""}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              >
                <option value="">Tanlang</option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.name}
                name={field.name}
                defaultValue={values[field.name] ?? ""}
                placeholder={field.placeholder ?? field.label}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <Search size={15} />
          Qidirish
        </button>
        <Link
          href={action}
          className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <X size={15} />
          Tozalash
        </Link>
      </div>
    </form>
  );
}
