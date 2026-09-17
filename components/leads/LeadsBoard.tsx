"use client";

import { useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Phone, Plus } from "lucide-react";
import { useLeads, type LeadRow } from "@/components/leads/LeadsProvider";
import { moveLead } from "@/lib/actions/leads";
import { formatDate, formatDaysAgo } from "@/lib/utils/date";
import { initials } from "@/lib/staff";
import { LEAD_STAGES, LEAD_STAGE_LABELS, type LeadStage } from "@/lib/validations/lead";

const STAGE_DOT: Record<LeadStage, string> = {
  new: "bg-sky-500",
  trial: "bg-amber-500",
  thinking: "bg-violet-500",
  contract: "bg-emerald-500",
  lost: "bg-slate-400",
};

export function LeadsBoard({ leads }: { leads: LeadRow[] }) {
  const router = useRouter();
  const { options, openCreate, openEdit } = useLeads();
  const [, startTransition] = useTransition();
  const [items, setItems] = useState(leads);
  const [prevLeads, setPrevLeads] = useState(leads);
  const [dragOver, setDragOver] = useState<LeadStage | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Server yangi ma'lumot yuborganda (router.refresh) mahalliy holat yangilanadi.
  if (leads !== prevLeads) {
    setPrevLeads(leads);
    setItems(leads);
  }

  const memberName = new Map(options.members.map((m) => [m.id, m.name]));

  function move(leadId: string, stage: LeadStage) {
    const lead = items.find((l) => l.id === leadId);
    if (!lead || lead.stage === stage) return;

    const previous = lead.stage;
    setError(null);
    setItems((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage } : l)));

    startTransition(async () => {
      const result = await moveLead(leadId, stage);
      if (!result.ok) {
        setItems((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: previous } : l)));
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDrop(e: DragEvent<HTMLElement>, stage: LeadStage) {
    e.preventDefault();
    setDragOver(null);
    const leadId = e.dataTransfer.getData("text/plain");
    if (leadId) move(leadId, stage);
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        <div className="grid min-w-[1100px] grid-cols-5 gap-3">
          {LEAD_STAGES.map((stage) => {
            const column = items.filter((l) => l.stage === stage);
            return (
              <section
                key={stage}
                aria-label={LEAD_STAGE_LABELS[stage]}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(stage);
                }}
                onDragLeave={() => setDragOver((current) => (current === stage ? null : current))}
                onDrop={(e) => handleDrop(e, stage)}
                className={`flex min-h-[420px] flex-col rounded-xl border bg-canvas transition-colors ${
                  dragOver === stage ? "border-brand-500 bg-brand-500/5" : "border-line"
                } ${stage === "lost" ? "opacity-80" : ""}`}
              >
                <header className="flex items-center gap-2 border-b border-line px-3 py-2.5">
                  <span className={`h-2 w-2 rounded-full ${STAGE_DOT[stage]}`} aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-ink">{LEAD_STAGE_LABELS[stage]}</h2>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-ink-muted">
                    {column.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => openCreate(stage)}
                    className="ml-auto rounded-md p-1 text-ink-faint hover:bg-surface hover:text-ink"
                    aria-label={`${LEAD_STAGE_LABELS[stage]} bosqichiga lid qo'shish`}
                  >
                    <Plus size={15} />
                  </button>
                </header>

                <div className="flex-1 space-y-2 p-2">
                  {column.length === 0 && (
                    <p className="px-2 py-6 text-center text-xs text-ink-faint">Lid yo&apos;q</p>
                  )}
                  {column.map((lead) => (
                    <article
                      key={lead.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", lead.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      className="cursor-grab rounded-lg border border-line bg-surface p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
                    >
                      <button
                        type="button"
                        onClick={() => openEdit(lead)}
                        className="block w-full text-left"
                      >
                        <div className="font-medium text-ink">{lead.full_name}</div>
                        {lead.interest && (
                          <div className="mt-0.5 truncate text-xs text-ink-muted">{lead.interest}</div>
                        )}
                      </button>

                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline"
                        >
                          <Phone size={12} aria-hidden="true" />
                          {lead.phone}
                        </a>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {lead.source && (
                          <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] text-ink-muted">
                            {lead.source}
                          </span>
                        )}
                        {lead.trial_date && stage !== "contract" && stage !== "lost" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                            <CalendarClock size={11} aria-hidden="true" />
                            {formatDate(lead.trial_date)}
                          </span>
                        )}
                        {lead.student_id && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                            O&apos;quvchi
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 flex items-center gap-2 border-t border-line pt-2">
                        {lead.assigned_to ? (
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-semibold text-white"
                            title={memberName.get(lead.assigned_to) ?? "Mas'ul"}
                          >
                            {initials(memberName.get(lead.assigned_to) ?? "?")}
                          </span>
                        ) : (
                          <span className="text-[11px] text-ink-faint">Mas&apos;ulsiz</span>
                        )}
                        <span className="text-[11px] text-ink-faint">{formatDaysAgo(lead.updated_at)}</span>
                        <select
                          value={lead.stage}
                          onChange={(e) => move(lead.id, e.target.value as LeadStage)}
                          aria-label="Bosqichni o'zgartirish"
                          className="ml-auto max-w-[110px] rounded-md border border-line bg-surface px-1.5 py-1 text-[11px] text-ink-muted focus:border-brand-500 focus:outline-none"
                        >
                          {LEAD_STAGES.map((s) => (
                            <option key={s} value={s}>
                              {LEAD_STAGE_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
