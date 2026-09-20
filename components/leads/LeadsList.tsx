"use client";

import { Inbox } from "lucide-react";
import { useLeads, type LeadRow } from "@/components/leads/LeadsProvider";
import { LEAD_STAGE_LABELS, type LeadStage } from "@/lib/validations/lead";
import { formatDate } from "@/lib/utils/date";

const TH = "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase";

const STAGE_BADGE: Record<LeadStage, string> = {
  new: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  contacted: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300",
  visit: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  test: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
  accepted: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  contract: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  paid: "bg-lime-50 text-lime-700 dark:bg-lime-500/10 dark:text-lime-300",
  enrolled: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  lost: "bg-canvas text-ink-muted",
};

/** all — «Buyurtmalar ro'yxati»; trial — «Birinchi darsga yozilganlar». */
export type LeadsListMode = "all" | "trial";

export function LeadsList({
  leads,
  mode,
  offset,
}: {
  leads: LeadRow[];
  mode: LeadsListMode;
  /** Sahifalashda tartib raqami shu sondan boshlanadi. */
  offset: number;
}) {
  const { options, openEdit } = useLeads();
  const memberName = new Map(options.members.map((m) => [m.id, m.name]));
  const teacherName = new Map((options.teachers ?? []).map((t) => [t.id, t.name]));
  const columnCount = mode === "trial" ? 10 : 9;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line bg-canvas">
          <tr>
            <th className={`${TH} w-12`}>№</th>
            <th className={TH}>ID</th>
            <th className={TH}>O&apos;quvchini ismi</th>
            <th className={TH}>Telefon raqam</th>
            <th className={TH}>Yaratilgan sanasi</th>
            {mode === "trial" && <th className={TH}>Birinchi darsga kelish sanasi</th>}
            <th className={TH}>O&apos;qituvchi</th>
            <th className={TH}>Kurs</th>
            <th className={TH}>Kurs darajasi</th>
            <th className={TH}>Moderator</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {leads.length === 0 ? (
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
            leads.map((lead, i) => (
              <tr key={lead.id} className="hover:bg-canvas">
                <td className="px-4 py-3 text-ink-faint">{offset + i + 1}</td>
                <td className="px-4 py-3 text-ink-muted">{lead.id.slice(0, 6).toUpperCase()}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openEdit(lead)}
                    className="text-left font-medium text-ink hover:text-brand-600"
                  >
                    {lead.full_name}
                  </button>
                  {lead.parent_name && (
                    <div className="text-xs text-ink-faint">{lead.parent_name}</div>
                  )}
                  {mode === "all" && (
                    <span
                      className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${STAGE_BADGE[lead.stage]}`}
                    >
                      {LEAD_STAGE_LABELS[lead.stage]}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{lead.phone || "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                  {formatDate(lead.created_at)}
                </td>
                {mode === "trial" && (
                  <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                    {lead.trial_date ? formatDate(lead.trial_date) : "—"}
                  </td>
                )}
                <td className="px-4 py-3 text-ink-muted">{lead.teacher_id ? (teacherName.get(lead.teacher_id) ?? "—") : "—"}</td>
                <td className="px-4 py-3 text-ink-muted">{lead.interest || "—"}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {lead.group_id ? (options.groupLevels?.[lead.group_id] ?? "—") : "—"}
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {lead.assigned_to ? (memberName.get(lead.assigned_to) ?? "—") : "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
