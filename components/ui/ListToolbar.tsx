"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from "@/lib/paging";

/**
 * Edu tizimdagi ro'yxat sahifalari uchun umumiy asboblar: qatorda turadigan
 * filtrlar ("Sozlash" bilan ko'rsatish/yashirish) va sahifalash ("50 qator").
 * Holat URL'da saqlanadi — server sahifa searchParams'dan filtrlaydi.
 */

export interface InlineField {
  /** URL query nomi. */
  name: string;
  label: string;
  type: "text" | "select" | "time" | "date" | "number" | "toggle";
  options?: { value: string; label: string }[];
  /** Param berilmasa shu qiymat ko'rsatiladi (masalan holat: "active"). Bo'sh variant qo'shilmaydi. */
  defaultValue?: string;
  width?: string;
}

const CONTROL =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-ink-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none";

function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /** `keepPage` false bo'lsa filtr o'zgarganda birinchi sahifaga qaytadi. */
  function update(changes: Record<string, string | null>, keepPage = false) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!keepPage) next.delete("page");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return { searchParams, update };
}

function TextFilter({
  field,
  value,
  onChange,
}: {
  field: InlineField;
  value: string;
  onChange: (value: string) => void;
}) {
  const [text, setText] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tashqi o'zgarish (masalan, boshqa sahifaga o'tish) kiritish maydoniga ham ta'sir qilsin.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(value);
  }, [value]);

  return (
    <input
      type="search"
      aria-label={field.label}
      placeholder={field.label}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        if (timer.current) clearTimeout(timer.current);
        const next = e.target.value.trim();
        timer.current = setTimeout(() => onChange(next), 350);
      }}
      className={CONTROL}
    />
  );
}

export function InlineFilters({
  fields,
  storageKey,
  actions,
  configurable = true,
}: {
  fields: InlineField[];
  /** Ko'rinadigan filtrlar tanlovi brauzerda shu kalit bilan saqlanadi. */
  storageKey: string;
  /** Chap tomondagi tugmalar (masalan "Qo'shish"). */
  actions?: ReactNode;
  /** false bo'lsa "Sozlash" tugmasi chiqmaydi (bitta-ikkita filtr bo'lgan sahifalar). */
  configurable?: boolean;
}) {
  const { searchParams, update } = useUrlParams();
  const key = `edu-filters:${storageKey}`;
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setHidden(JSON.parse(saved) as string[]);
    } catch {
      // Maxfiy rejim — barcha filtrlar ko'rinadi.
    }
  }, [key]);

  function persist(next: string[]) {
    setHidden(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Saqlab bo'lmasa ham joriy sessiyada ishlaydi.
    }
  }

  const visible = useMemo(
    () => fields.filter((f) => !hidden.includes(f.name)),
    [fields, hidden],
  );

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-2">{actions}</div>

      <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
        {visible.map((field) => {
          const value =
            searchParams.get(field.name) ?? field.defaultValue ?? "";
          return (
            <div key={field.name} className={field.width ?? "w-44"}>
              {field.type === "text" ? (
                <TextFilter
                  field={field}
                  value={searchParams.get(field.name) ?? ""}
                  onChange={(v) => update({ [field.name]: v || null })}
                />
              ) : field.type === "toggle" ? (
                <label className="flex h-9 cursor-pointer items-center gap-2 text-[13px] text-ink">
                  <input
                    type="checkbox"
                    role="switch"
                    checked={value === "1"}
                    onChange={(e) =>
                      update({ [field.name]: e.target.checked ? "1" : null })
                    }
                    className="h-4 w-4 accent-brand-600"
                  />
                  {field.label}
                </label>
              ) : field.type === "select" ? (
                <select
                  aria-label={field.label}
                  value={value}
                  onChange={(e) =>
                    update({ [field.name]: e.target.value || null })
                  }
                  className={CONTROL}
                >
                  {field.defaultValue === undefined && (
                    <option value="">{field.label}</option>
                  )}
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  aria-label={field.label}
                  title={field.label}
                  placeholder={field.label}
                  value={value}
                  onChange={(e) =>
                    update({ [field.name]: e.target.value || null })
                  }
                  className={CONTROL}
                />
              )}
            </div>
          );
        })}

        {configurable && (
          <Popover
            ariaLabel="Filtrlarni sozlash"
            triggerClassName="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-muted transition-colors hover:bg-canvas"
            panelClassName="w-56 p-2"
            label={<Settings2 size={16} />}
          >
            <div className="px-2 pt-1 pb-2 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
              Sozlash
            </div>
            {fields.map((field) => (
              <label
                key={field.name}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-ink hover:bg-canvas"
              >
                <input
                  type="checkbox"
                  checked={!hidden.includes(field.name)}
                  onChange={(e) =>
                    persist(
                      e.target.checked
                        ? hidden.filter((n) => n !== field.name)
                        : [...hidden, field.name],
                    )
                  }
                  className="h-4 w-4 accent-brand-600"
                />
                {field.label}
              </label>
            ))}
            <button
              type="button"
              onClick={() => persist([])}
              className="mt-1 w-full rounded-lg border-t border-line px-2 pt-2 text-left text-xs text-brand-600 hover:underline"
            >
              Standartga qaytarish
            </button>
          </Popover>
        )}
      </div>
    </div>
  );
}

/** Jadval tagidagi sahifalash: "1-50 / Jami: N", oldingi/keyingi va qatorlar soni. */
export function TablePager({
  total,
  page,
  size,
}: {
  total: number;
  page: number;
  size: number;
}) {
  const { update } = useUrlParams();
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(page, pages);
  const from = total === 0 ? 0 : (current - 1) * size + 1;
  const to = Math.min(total, current * size);

  const goTo = (nextPage: number) =>
    update({ page: nextPage > 1 ? String(nextPage) : null }, true);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-xs text-ink-muted">
      <span>
        {from}-{to} / Jami: {total}
      </span>
      <div className="flex items-center gap-2">
        <select
          aria-label="Sahifadagi qatorlar soni"
          value={size}
          onChange={(e) =>
            update({
              size:
                Number(e.target.value) === DEFAULT_PAGE_SIZE
                  ? null
                  : e.target.value,
            })
          }
          className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s} qator
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          disabled={current <= 1}
          aria-label="Oldingi sahifa"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-line hover:bg-canvas disabled:opacity-40"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="min-w-12 text-center text-ink">
          {current} / {pages}
        </span>
        <button
          type="button"
          onClick={() => goTo(current + 1)}
          disabled={current >= pages}
          aria-label="Keyingi sahifa"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-line hover:bg-canvas disabled:opacity-40"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
