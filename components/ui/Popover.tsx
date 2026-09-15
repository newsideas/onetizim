"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Tugma + ochiladigan panel. Tashqariga bosilganda yoki Esc bosilganda
 * yopiladi. Header'dagi barcha menyular shu komponentga tayanadi.
 */
export function Popover({
  label,
  children,
  triggerClassName = "",
  panelClassName = "",
  align = "right",
  ariaLabel,
}: {
  label: ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  triggerClassName?: string;
  panelClassName?: string;
  align?: "left" | "right";
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        className={triggerClassName}
      >
        {label}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-40 mt-2 rounded-xl border border-line bg-surface p-1.5 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          } ${panelClassName}`}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}

/** Menyu ichidagi bir qator — havola yoki tugma sifatida ishlatiladi. */
export function PopoverItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink transition-colors hover:bg-canvas ${className}`}
    >
      {children}
    </div>
  );
}
