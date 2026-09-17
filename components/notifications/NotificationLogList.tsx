import { CheckCircle2, XCircle } from "lucide-react";
import { NOTIFICATION_KIND_LABELS, type NotificationKind } from "@/lib/notifications/log";
import { formatDate } from "@/lib/utils/date";

export interface NotificationLogRow {
  id: string;
  kind: NotificationKind;
  channel: string;
  message: string;
  success: boolean;
  created_at: string;
  student: { full_name: string } | null;
}

export function NotificationLogList({ items }: { items: NotificationLogRow[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
        Hali bildirishnoma yuborilmagan.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-canvas text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Qabul qiluvchi</th>
            <th className="px-4 py-3 font-medium">Turi</th>
            <th className="px-4 py-3 font-medium">Matn</th>
            <th className="px-4 py-3 font-medium">Holati</th>
            <th className="px-4 py-3 font-medium">Sana</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((n) => (
            <tr key={n.id} className="hover:bg-canvas">
              <td className="px-4 py-3 text-ink">{n.student?.full_name ?? "Ommaviy"}</td>
              <td className="px-4 py-3 text-ink-muted">{NOTIFICATION_KIND_LABELS[n.kind]}</td>
              <td className="max-w-xs truncate px-4 py-3 text-ink-muted" title={n.message}>
                {n.message}
              </td>
              <td className="px-4 py-3">
                {n.success ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={14} /> Yuborildi
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-red-600">
                    <XCircle size={14} /> Xatolik
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-ink-muted">{formatDate(n.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
