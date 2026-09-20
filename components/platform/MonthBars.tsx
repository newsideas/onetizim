/** Oylar bo'yicha oddiy ustunli grafik (kutubxonasiz): eng katta qiymat to'liq balandlikka teng. */
export function MonthBars({
  items,
  emptyLabel = "Ma'lumot yo'q",
}: {
  items: { label: string; value: number; display: string }[];
  emptyLabel?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 0);
  if (max === 0) return <p className="py-10 text-center text-sm text-ink-faint">{emptyLabel}</p>;

  return (
    <div className="flex h-44 items-end gap-3 px-1 pt-6">
      {items.map((item) => (
        <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
          <span className="truncate text-[11px] text-ink-muted tabular-nums">{item.value > 0 ? item.display : ""}</span>
          <div
            className="w-full max-w-10 rounded-t bg-brand-600"
            style={{ height: `${Math.max((item.value / max) * 100, item.value > 0 ? 3 : 0)}%` }}
            title={`${item.label}: ${item.display}`}
          />
          <span className="text-[11px] text-ink-faint">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
