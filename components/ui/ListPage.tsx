import type { ReactNode } from "react";

/**
 * Ro'yxat sahifasining umumiy skeleti — My School'dagi barcha
 * bo'limlar shu ko'rinishda: sarlavha, amal tugmalari, filtrlar,
 * jadval, bo'sh holat va sahifalash.
 */
export function ListPageShell({
  title,
  subtitle,
  actions,
  filters,
  tabs,
  notice,
  children,
}: {
  title: string;
  /** Sarlavha ostidagi qator: "… ro'yxati" yoki "… menyusi". */
  subtitle: string;
  actions?: ReactNode;
  filters?: ReactNode;
  tabs?: ReactNode;
  /** Bo'lim hali to'liq ishlamasa — foydalanuvchini chalg'itmaslik uchun. */
  notice?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">{title}</h1>
          <p className="mt-0.5 text-sm text-ink-faint">{subtitle}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      {notice && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          {notice}
        </div>
      )}

      {tabs}
      {filters}
      {children}
    </div>
  );
}

export interface Column<T> {
  /** Ustun sarlavhasi — jadvalda katta harflarda chiqadi. */
  header: string;
  /** Qator uchun katak mazmuni. */
  cell: (row: T, index: number) => ReactNode;
  /** O'ngga tekislash (summalar uchun). */
  align?: "left" | "right";
}

/**
 * Ro'yxat jadvali: birinchi ustun tartib raqami, oxirida amallar.
 * Ma'lumot bo'lmasa My School'dagidek bo'sh holat matni chiqadi.
 */
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  rowActions,
  emptyText = "Hech qanday ma'lumot topilmadi",
  /** Sahifalash uchun — hozircha barcha qatorlar bir sahifada. */
  total,
}: {
  rows: T[];
  columns: Column<T>[];
  rowActions?: (row: T) => ReactNode;
  emptyText?: string;
  total?: number;
}) {
  const count = total ?? rows.length;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-canvas">
            <tr>
              <th className="w-12 px-4 py-3 text-xs font-semibold text-ink-muted">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col.header}
                  className={`px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase ${
                    col.align === "right" ? "text-right" : ""
                  }`}
                >
                  {col.header}
                </th>
              ))}
              {rowActions && (
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Amallar
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (rowActions ? 2 : 1)}
                  className="px-4 py-12 text-center text-ink-faint"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={row.id} className="hover:bg-canvas">
                  <td className="px-4 py-3 text-ink-faint">{i + 1}</td>
                  {columns.map((col) => (
                    <td
                      key={col.header}
                      className={`px-4 py-3 text-ink ${
                        col.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {col.cell(row, i)}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-4 py-3">{rowActions(row)}</td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-line px-4 py-2.5 text-xs text-ink-faint">
        {count === 0 ? "0-0" : `1-${rows.length}`} / Jami: {count}
      </div>
    </div>
  );
}
