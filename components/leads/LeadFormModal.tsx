"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import type { LeadOptions, LeadRow } from "@/components/leads/LeadsProvider";
import {
  convertLeadToStudent,
  createLead,
  deleteLead,
  updateLead,
} from "@/lib/actions/leads";
import { LEAD_STAGES, LEAD_STAGE_LABELS, type LeadStage } from "@/lib/validations/lead";

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none disabled:opacity-60";

function Field({ label, htmlFor, required, children }: { label: string; htmlFor: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-ink-muted">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

export function LeadFormModal({
  lead,
  defaultStage,
  options,
  onClose,
}: {
  lead: LeadRow | null;
  defaultStage: LeadStage;
  options: LeadOptions;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [studentId, setStudentId] = useState(lead?.student_id ?? null);

  const [values, setValues] = useState({
    fullName: lead?.full_name ?? "",
    phone: lead?.phone ?? "",
    source: lead?.source ?? "",
    interest: lead?.interest ?? "",
    stage: lead?.stage ?? defaultStage,
    assignedTo: lead?.assigned_to ?? "",
    trialDate: lead?.trial_date ?? "",
    note: lead?.note ?? "",
  });

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>, closeAfter = true) {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.error);
      router.refresh();
      if (closeAfter) onClose();
    });
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (values.fullName.trim().length < 2) return setError("Ism familiyani kiriting");
    run(() => (lead ? updateLead(lead.id, values) : createLead(values)));
  }

  function remove() {
    if (!lead || !confirm(`"${lead.full_name}" lidini o'chirmoqchimisiz?`)) return;
    run(() => deleteLead(lead.id));
  }

  function convert() {
    if (!lead) return;
    setError(undefined);
    startTransition(async () => {
      const result = await convertLeadToStudent(lead.id);
      if (!result.ok) return setError(result.error);
      setStudentId(result.data);
      set("stage", "contract");
      router.refresh();
    });
  }

  return (
    <Modal open onClose={isPending ? () => {} : onClose} title={lead ? "Lidni tahrirlash" : "Yangi lid"}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Ism familiya" htmlFor="lead-name" required>
          <input
            id="lead-name"
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            maxLength={120}
            autoFocus
            disabled={isPending}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Telefon" htmlFor="lead-phone">
            <input
              id="lead-phone"
              type="tel"
              inputMode="tel"
              placeholder="+998"
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
              maxLength={30}
              disabled={isPending}
              className={inputClass}
            />
          </Field>
          <Field label="Bosqich" htmlFor="lead-stage">
            <select
              id="lead-stage"
              value={values.stage}
              onChange={(e) => set("stage", e.target.value as LeadStage)}
              disabled={isPending}
              className={inputClass}
            >
              {LEAD_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {LEAD_STAGE_LABELS[stage]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Manba" htmlFor="lead-source">
            <input
              id="lead-source"
              list="lead-sources"
              value={values.source}
              onChange={(e) => set("source", e.target.value)}
              maxLength={60}
              disabled={isPending}
              className={inputClass}
            />
            <datalist id="lead-sources">
              {options.sources.map((source) => (
                <option key={source} value={source} />
              ))}
            </datalist>
          </Field>
          <Field label="Qiziqqan kurs" htmlFor="lead-interest">
            <input
              id="lead-interest"
              list="lead-interests"
              value={values.interest}
              onChange={(e) => set("interest", e.target.value)}
              maxLength={120}
              disabled={isPending}
              className={inputClass}
            />
            <datalist id="lead-interests">
              {options.interests.map((interest) => (
                <option key={interest} value={interest} />
              ))}
            </datalist>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Mas'ul menejer" htmlFor="lead-assigned">
            <select
              id="lead-assigned"
              value={values.assignedTo}
              onChange={(e) => set("assignedTo", e.target.value)}
              disabled={isPending}
              className={inputClass}
            >
              <option value="">Biriktirilmagan</option>
              {options.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sinov darsi sanasi" htmlFor="lead-trial">
            <input
              id="lead-trial"
              type="date"
              value={values.trialDate}
              onChange={(e) => set("trialDate", e.target.value)}
              disabled={isPending}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Izoh" htmlFor="lead-note">
          <textarea
            id="lead-note"
            rows={3}
            value={values.note}
            onChange={(e) => set("note", e.target.value)}
            maxLength={2000}
            disabled={isPending}
            className={inputClass}
          />
        </Field>

        {lead && (
          <div className="rounded-lg bg-canvas px-3 py-2.5 text-sm">
            {studentId ? (
              <span className="text-ink-muted">
                O&apos;quvchilar bazasiga qo&apos;shilgan.{" "}
                <Link
                  href={`/education/students/${studentId}`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  Kartani ochish
                </Link>
              </span>
            ) : (
              <button
                type="button"
                onClick={convert}
                disabled={isPending}
                className="inline-flex items-center gap-2 font-medium text-brand-600 hover:text-brand-700 disabled:opacity-60"
              >
                <UserPlus size={15} aria-hidden="true" />
                O&apos;quvchilar bazasiga qo&apos;shish
              </button>
            )}
          </div>
        )}

        <FormError message={error} />

        <div className="flex items-center gap-2 pt-1">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Bekor qilish
          </Button>
          {lead && (
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              className="ml-auto rounded-lg p-2 text-ink-faint transition-colors hover:bg-red-50 hover:text-red-600"
              aria-label="Lidni o'chirish"
              title="O'chirish"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
