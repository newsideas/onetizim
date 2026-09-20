import Link from "next/link";
import { Inbox } from "lucide-react";
import { formatSom } from "@/lib/utils/currency";
import { formatDate, formatTime } from "@/lib/utils/date";
import { termsFor, type Segment } from "@/lib/segment";
import type { Group } from "@/types/database";

/** Guruh + bog'langan yozuvlar (0008'dan keyin xona va kurs alohida jadval). */
export type GroupRow = Group & {
  teacher: { full_name: string } | null;
  room: { name: string } | null;
  course: { name: string } | null;
  students?: { id: string; status: string }[];
};

/** Barcha guruh so'rovlarida ishlatiladigan bir xil select. */
export const GROUP_SELECT =
  "*, teacher:teachers(full_name), room:rooms(name), course:courses(name), students(id, status)";

/** Jadvalda ko'rsatiladigan kun/vaqt: dars jadvalidan (lessons) yoki guruhning o'zidan. */
export interface GroupSchedule {
  days: string[];
  start: string | null;
  end: string | null;
}

const DAY_SHORT: Record<string, string> = {
  Dushanba: "Du",
  Seshanba: "Se",
  Chorshanba: "Chor",
  Payshanba: "Pa",
  Juma: "Ju",
  Shanba: "Sha",
  Yakshanba: "Yak",
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  waiting: {
    label: "Kutilmoqda",
    className: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  archived: {
    label: "Arxiv",
    className: "bg-canvas text-ink-muted",
  },
};

const TH = "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase";

export function GroupsTable({
  groups,
  segment,
  schedules,
  offset = 0,
  showPrice = true,
}: {
  groups: GroupRow[];
  segment: Segment;
  /** group.id → jadval; berilmasa guruhning o'z maydonlari ishlatiladi. */
  schedules?: Record<string, GroupSchedule>;
  /** Sahifalashda tartib raqami shu sondan boshlanadi. */
  offset?: number;
  /** Narx moliyaviy ma'lumot: o'qituvchiga ko'rsatilmaydi. */
  showPrice?: boolean;
}) {
  const terms = termsFor(segment);

  // Kurs va daraja faqat o'quv markazlarda: maktabda sinf ko'p fanli.
  const isCourseBased = segment === "markaz";
  const columnCount = 8 + (isCourseBased ? 2 : 0) + (showPrice ? 1 : 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-canvas">
          <tr>
            <th className={`${TH} w-12`}>№</th>
            <th className={TH}>{terms.group} nomi</th>
            {isCourseBased && <th className={TH}>Kurs</th>}
            {isCourseBased && <th className={TH}>Darajasi</th>}
            <th className={TH}>Kun</th>
            <th className={TH}>Dars vaqti</th>
            <th className={TH}>{terms.group} vaqti</th>
            <th className={TH}>{terms.studentPlural}</th>
            <th className={TH}>{terms.teacher}</th>
            <th className={TH}>Xona</th>
            {showPrice && <th className={TH}>Narxi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {groups.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="px-4 py-16 text-center">
                <Inbox size={22} className="mx-auto mb-2 text-ink-faint" aria-hidden="true" />
                <div className="text-sm font-medium text-ink-muted">Ma&apos;lumotlar topilmadi</div>
                <div className="mt-0.5 text-xs text-ink-faint">
                  Ma&apos;lumotlar topilmadi. Filterni o&apos;zgartirib ko&apos;ring.
                </div>
              </td>
            </tr>
          ) : (
            groups.map((group, i) => {
              const schedule = schedules?.[group.id] ?? {
                days: group.schedule_days ?? [],
                start: group.start_time,
                end: group.end_time,
              };
              const badge = STATUS_BADGE[group.status];
              const studentCount = group.students?.length ?? 0;

              return (
                <tr key={group.id} className="hover:bg-canvas">
                  <td className="px-4 py-3 text-ink-faint">{offset + i + 1}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/education/groups/${group.id}`}
                      className="font-medium text-ink hover:text-brand-600"
                    >
                      {group.name}
                    </Link>
                    {badge && (
                      <span
                        className={`ml-2 rounded px-1.5 py-0.5 text-[11px] font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    )}
                  </td>
                  {isCourseBased && (
                    <td className="px-4 py-3 text-ink-muted">{group.course?.name || "—"}</td>
                  )}
                  {isCourseBased && (
                    <td className="px-4 py-3 text-ink-muted">{group.level || "—"}</td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                    {schedule.days.map((d) => DAY_SHORT[d] ?? d).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                    {schedule.start
                      ? `${formatTime(schedule.start)}${schedule.end ? ` - ${formatTime(schedule.end)}` : ""}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                    {group.start_date
                      ? `${formatDate(group.start_date)}${group.end_date ? ` - ${formatDate(group.end_date)}` : ""}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink">{studentCount}</td>
                  <td className="px-4 py-3 text-ink-muted">{group.teacher?.full_name || "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{group.room?.name || "—"}</td>
                  {showPrice && (
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                      {formatSom(group.monthly_price)}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
