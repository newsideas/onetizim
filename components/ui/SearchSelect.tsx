"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

export interface SearchOption {
  value: string;
  label: string;
}

/**
 * Qidiruvli tanlov (Edu tizimdagi "O'quvchini qidirish" maydoni): yozgan sari ro'yxat
 * filtrlanadi, qiymat sifatida tanlangan variantning `value` qaytadi.
 */
export function SearchSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchOption[];
  placeholder: string;
  disabled?: boolean;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const q = query.trim().toLowerCase();
  const visible = (q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options).slice(0, 50);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function pick(next: string) {
    onChange(next);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          autoComplete="off"
          disabled={disabled}
          placeholder={selected ? selected.label : placeholder}
          value={open ? query : (selected?.label ?? "")}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 pr-14 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none disabled:opacity-60"
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1 text-ink-faint">
          {value && !disabled && (
            <button type="button" onClick={() => pick("")} aria-label="Tozalash" className="rounded p-0.5 hover:text-ink">
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} aria-hidden="true" />
        </div>
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-lg"
        >
          {visible.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink-faint">Topilmadi</li>
          ) : (
            visible.map((o) => (
              <li key={o.value} role="option" aria-selected={o.value === value}>
                <button
                  type="button"
                  onClick={() => pick(o.value)}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-canvas ${
                    o.value === value ? "font-medium text-brand-600" : "text-ink"
                  }`}
                >
                  {o.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
