import { formatSom } from "@/lib/utils/currency";
import { formatDate, formatTime } from "@/lib/utils/date";
import { EDUCATION_TYPE_LABELS } from "@/lib/validations/group";
import type { GroupRow } from "@/components/groups/GroupsTable";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-white/50">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}

export function GroupInfoCard({
  group,
  studentCount,
}: {
  group: GroupRow;
  studentCount: number;
}) {
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
    <div className="space-y-5 rounded-xl border border-white/10 p-4 text-sm">
      <div>
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-white/40 uppercase">
          Guruh ma&apos;lumotlari
        </h2>
        <div className="space-y-2.5">
          <Row label="Fan" value={group.course?.name || "—"} />
          <Row label="O'qituvchi" value={group.teacher?.full_name || "—"} />
          <Row
            label="Ta'lim turi"
            value={
              group.education_type
                ? EDUCATION_TYPE_LABELS[group.education_type]
                : "—"
            }
          />
          <Row label="Xona" value={group.room?.name || "—"} />
          <Row label="O'quvchilar" value={String(studentCount)} />
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-white/40 uppercase">
          Dars jadvali
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

      <div className="border-t border-white/10 pt-4">
        <h2 className="mb-3 text-xs font-semibold tracking-wide text-white/40 uppercase">
          Moliyaviy
        </h2>
        <div className="space-y-2.5">
          <Row label="Oylik narxi" value={formatSom(group.monthly_price)} />
          <Row label="Faoliyat muddati" value={muddat} />
        </div>
      </div>
    </div>
  );
}
