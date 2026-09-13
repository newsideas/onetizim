import Link from "next/link";
import { formatSom } from "@/lib/utils/currency";
import type { Group } from "@/types/database";

export type GroupRow = Group & { teacher: { full_name: string } | null };

export function GroupsTable({ groups }: { groups: GroupRow[] }) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 p-8 text-center text-white/50">
        Hali guruhlar yo&apos;q. &quot;Yangi guruh&quot; tugmasi orqali qo&apos;shing.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-white/60">
          <tr>
            <th className="px-4 py-3 font-medium">Nomi</th>
            <th className="px-4 py-3 font-medium">Fan</th>
            <th className="px-4 py-3 font-medium">O&apos;qituvchi</th>
            <th className="px-4 py-3 font-medium">Xona</th>
            <th className="px-4 py-3 font-medium">Dars kunlari</th>
            <th className="px-4 py-3 font-medium">Narxi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {groups.map((group) => (
            <tr key={group.id} className="hover:bg-white/5">
              <td className="px-4 py-3">
                <Link
                  href={`/groups/${group.id}`}
                  className="font-medium text-white hover:text-blue-400"
                >
                  {group.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-white/70">{group.subject || "—"}</td>
              <td className="px-4 py-3 text-white/70">
                {group.teacher?.full_name || "—"}
              </td>
              <td className="px-4 py-3 text-white/70">{group.room || "—"}</td>
              <td className="px-4 py-3 text-white/70">
                {group.schedule_days?.map((d) => d.slice(0, 3)).join(", ") || "—"}
              </td>
              <td className="px-4 py-3 text-white/70">
                {formatSom(group.monthly_price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
