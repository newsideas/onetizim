"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { LeadFormModal } from "@/components/leads/LeadFormModal";
import type { InterestLevel, LeadStage } from "@/lib/validations/lead";

export interface LeadRow {
  id: string;
  full_name: string;
  parent_name: string | null;
  phone: string | null;
  source: string | null;
  interest: string | null;
  stage: LeadStage;
  assigned_to: string | null;
  trial_date: string | null;
  interest_level: InterestLevel | null;
  next_contact_on: string | null;
  note: string | null;
  student_id: string | null;
  created_at: string;
  updated_at: string;
  // "Yangi buyurtma" maydonlari (0054); migratsiya qo'llanmaguncha bazadan kelmaydi.
  referral_student_id?: string | null;
  lesson_days?: string | null;
  lesson_time?: string | null;
  teacher_id?: string | null;
  group_id?: string | null;
  trial_time?: string | null;
}

export interface LeadOptions {
  members: { id: string; name: string }[];
  sources: string[];
  interests: string[];
}

interface LeadsContextValue {
  options: LeadOptions;
  openCreate: (stage?: LeadStage) => void;
  openEdit: (lead: LeadRow) => void;
}

const LeadsContext = createContext<LeadsContextValue | null>(null);

export function LeadsProvider({ options, children }: { options: LeadOptions; children: ReactNode }) {
  const [modal, setModal] = useState<{ lead: LeadRow | null; stage: LeadStage } | null>(null);

  const openCreate = useCallback((stage: LeadStage = "new") => setModal({ lead: null, stage }), []);
  const openEdit = useCallback((lead: LeadRow) => setModal({ lead, stage: lead.stage }), []);
  const close = useCallback(() => setModal(null), []);

  return (
    <LeadsContext.Provider value={{ options, openCreate, openEdit }}>
      {children}
      {modal && (
        <LeadFormModal
          key={modal.lead?.id ?? `new-${modal.stage}`}
          lead={modal.lead}
          defaultStage={modal.stage}
          options={options}
          onClose={close}
        />
      )}
    </LeadsContext.Provider>
  );
}

export function useLeads(): LeadsContextValue {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads faqat LeadsProvider ichida ishlatiladi");
  return ctx;
}

export function NewLeadButton() {
  const { openCreate } = useLeads();
  return (
    <button
      type="button"
      onClick={() => openCreate()}
      className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
    >
      <Plus size={16} aria-hidden="true" />
      Buyurtma qo&apos;shish
    </button>
  );
}
