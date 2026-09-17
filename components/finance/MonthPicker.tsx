"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Oy tanlanishi bilan sahifa ?month=YYYY-MM bilan qayta yuklanadi. */
export function MonthPicker({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm text-ink-muted">
      Oy
      <input
        type="month"
        value={value.slice(0, 7)}
        onChange={(e) => {
          if (!e.target.value) return;
          const params = new URLSearchParams(searchParams.toString());
          params.set("month", e.target.value);
          router.push(`${pathname}?${params.toString()}`);
        }}
        className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
      />
    </label>
  );
}
