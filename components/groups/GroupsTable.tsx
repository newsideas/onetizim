import Link from "next/link";
import { formatSom } from "@/lib/utils/currency";
import type { Group } from "@/types/database";

/** Guruh + bog'langan yozuvlar (0008'dan keyin xona va kurs alohida jadval). */
export type GroupRow = Group & {
  teacher: { full_name: string } | null;
  room: { name: string } | null;
  course: { name: string } | null;
};

/** Barcha guruh so'rovlarida ishlatiladigan bir xil select. */
export const GROUP_SELECT =
  "*, teacher:teachers(full_name), room:rooms(name), course:courses(name)";

export function GroupsTable({ groups }: { groups: GroupRow[] }) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
        Hali guruhlar yo&apos;q. &quot;Yangi guruh&quot; tugmasi orqali qo&apos;shing.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-canvas text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Nomi</th>
            <th className="px-4 py-3 font-medium">Fan</th>
            <th className="px-4 py-3 font-medium">O&apos;qituvchi</th>
            <th className="px-4 py-3 font-medium">Xona</th>
            <th className="px-4 py-3 font-medium">Dars kunlari</th>
            <th className="px-4 py-3 font-medium">Narxi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {groups.map((group) => (
            <tr key={group.id} className="hover:bg-canvas">
              <td className="px-4 py-3">
                <Link
                  href={`/groups/${group.id}`}
                  className="font-medium text-ink hover:text-brand-600"
                >
                  {group.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink-muted">{group.course?.name || "—"}</td>
              <td className="px-4 py-3 text-ink-muted">
                {group.teacher?.full_name || "—"}
              </td>
              <td className="px-4 py-3 text-ink-muted">{group.room?.name || "—"}</td>
              <td className="px-4 py-3 text-ink-muted">
                {group.schedule_days?.map((d) => d.slice(0, 3)).join(", ") || "—"}
              </td>
              <td className="px-4 py-3 text-ink-muted">
                {formatSom(group.monthly_price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
