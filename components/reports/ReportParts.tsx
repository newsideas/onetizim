import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

/**
 * Hisobot sahifalari uchun umumiy qismlar (Moliya, Nazorat, Hisobotlar):
 * ko'rsatkich kartalari va oddiy jadval. Server komponentlar — hech qanday holat yo'q.
 */

const TH = "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase";

export function ReportCards({
  items,
}: {
  items: { label: string; value: ReactNode; tone?: "default" | "good" | "bad" }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
        >
          <div className="text-xs text-ink-muted">{item.label}</div>
          <div
            className={`mt-1 text-xl font-bold ${
              item.tone === "good" ? "text-green-600" : item.tone === "bad" ? "text-red-600" : "text-ink"
            }`}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export interface ReportColumn<T> {
  header: string;
  cell: (row: T, index: number) => ReactNode;
  align?: "left" | "right";
}

export function ReportTable<T>({
  rows,
  columns,
  rowKey,
  footer,
}: {
  rows: T[];
  columns: ReportColumn<T>[];
  rowKey: (row: T) => string;
  /** Jadval tagidagi qator (masalan, "Jami"). */
  footer?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex justify-end px-4 py-3">
        <span className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink-muted">
          Umumiy soni <b className="ml-1 text-ink">{rows.length}</b>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-canvas">
            <tr>
              <th className={`${TH} w-12`}>№</th>
              {columns.map((c) => (
                <th key={c.header} className={`${TH} ${c.align === "right" ? "text-right" : ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-16 text-center">
                  <Inbox size={22} className="mx-auto mb-2 text-ink-faint" aria-hidden="true" />
                  <div className="text-sm font-medium text-ink-muted">Ma&apos;lumotlar topilmadi</div>
                  <div className="mt-0.5 text-xs text-ink-faint">
                    Ma&apos;lumotlar topilmadi. Filterni o&apos;zgartirib ko&apos;ring.
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={rowKey(row)} className="hover:bg-canvas">
                  <td className="px-4 py-3 text-ink-faint">{i + 1}</td>
                  {columns.map((c) => (
                    <td
                      key={c.header}
                      className={`px-4 py-3 text-ink-muted ${c.align === "right" ? "text-right" : ""}`}
                    >
                      {c.cell(row, i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {footer && <tfoot className="border-t border-line bg-canvas font-medium text-ink">{footer}</tfoot>}
        </table>
      </div>
    </div>
  );
}
