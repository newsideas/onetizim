import { formatSom } from "@/lib/utils/currency";
import { formatDate, formatTime } from "@/lib/utils/date";
import { EDUCATION_TYPE_LABELS } from "@/lib/validations/group";
import { termsFor, type Segment } from "@/lib/segment";
import type { GroupRow } from "@/components/groups/GroupsTable";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-ink-faint">{label}</span>
      <span className="text-right text-ink">{value}</span>
    </div>
  );
}

export function GroupInfoCard({
  group,
  studentCount,
  segment,
  showFinance = true,
}: {
  group: GroupRow;
  studentCount: number;
  segment: Segment;
  /** Narx va muddat moliyaviy ma'lumot: o'qituvchiga ko'rsatilmaydi. */
  showFinance?: boolean;
}) {
  const terms = termsFor(segment);

  // Fan, ta'lim turi va dars jadvali faqat o'quv markazlarda guruhga tegishli.
  const isCourseBased = segment === "markaz";

  const dars =
    group.start_time && group.end_time
      ? `${formatTime(group.start_time)} – ${formatTime(group.end_time)}`
      : "—";

  const muddat =
    group.start_date || group.end_date
      ? `${group.start_date ? formatDate(group.start_date) : "—"} – ${
          group.end_date ? formatDate(group.end_date) : "—"
        }`
      : "—";

  return (
    <div className="space-y-5 rounded-xl border border-line p-4 text-sm">
      <div>
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-ink-faint uppercase">
          {terms.group} ma&apos;lumotlari
        </h2>
        <div className="space-y-2.5">
          {isCourseBased && (
            <Row label="Fan" value={group.course?.name || "—"} />
          )}
          <Row label={terms.teacher} value={group.teacher?.full_name || "—"} />
          {isCourseBased && (
            <Row
              label="Ta'lim turi"
              value={
                group.education_type
                  ? EDUCATION_TYPE_LABELS[group.education_type]
                  : "—"
              }
            />
          )}
          <Row label="Xona" value={group.room?.name || "—"} />
          <Row label={terms.studentPlural} value={String(studentCount)} />
        </div>
      </div>

      {isCourseBased && (
        <div className="border-t border-line pt-4">
          <h2 className="mb-3 text-xs font-semibold tracking-wide text-ink-faint uppercase">
            {terms.schedule}
          </h2>
          <div className="space-y-2.5">
            <Row label="Dars vaqti" value={dars} />
            <Row
              label="Dars kunlari"
              value={group.schedule_days?.join(", ") || "—"}
            />
            <Row
              label="Davomiyligi"
              value={
                group.lesson_duration_minutes
                  ? `${group.lesson_duration_minutes} daqiqa`
                  : "—"
              }
            />
          </div>
        </div>
      )}

      {showFinance && (
        <div className="border-t border-line pt-4">
          <h2 className="mb-3 text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Moliyaviy
          </h2>
          <div className="space-y-2.5">
            <Row label="Oylik narxi" value={formatSom(group.monthly_price)} />
            <Row label="Faoliyat muddati" value={muddat} />
          </div>
        </div>
      )}
    </div>
  );
}
