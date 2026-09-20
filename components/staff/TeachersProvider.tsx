"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { TeacherFormModal } from "@/components/staff/TeacherFormModal";
import type { SalaryType } from "@/types/database";
import type { TeacherKind } from "@/lib/validations/staff";

export interface TeacherRow {
  id: string;
  full_name: string;
  phone: string | null;
  position: string | null;
  kind: TeacherKind;
  salary_type: SalaryType | null;
  rate: number | null;
  is_active: boolean;
  // "Xodim qo'shish" maydonlari (0055); migratsiya qo'llanmaguncha bazadan kelmaydi.
  gender?: string | null;
  birth_date?: string | null;
  pays_salary?: boolean | null;
  work_schedule_id?: string | null;
  comment?: string | null;
  email?: string | null;
  // Ro'yxat uchun (0072 va hisoblangan ustunlar)
  created_at?: string;
  branch_ids?: string[] | null;
  left_on?: string | null;
  leave_reason?: string | null;
}

interface TeachersContextValue {
  openCreate: () => void;
  openEdit: (teacher: TeacherRow) => void;
}

const TeachersContext = createContext<TeachersContextValue | null>(null);

export function TeachersProvider({ children }: { children: ReactNode }) {
  const [editing, setEditing] = useState<TeacherRow | null>(null);
  const [open, setOpen] = useState(false);

  const openCreate = useCallback(() => {
    setEditing(null);
    setOpen(true);
  }, []);
  const openEdit = useCallback((teacher: TeacherRow) => {
    setEditing(teacher);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <TeachersContext.Provider value={{ openCreate, openEdit }}>
      {children}
      {open && <TeacherFormModal key={editing?.id ?? "new"} teacher={editing} onClose={close} />}
    </TeachersContext.Provider>
  );
}

export function useTeachers(): TeachersContextValue {
  const ctx = useContext(TeachersContext);
  if (!ctx) throw new Error("useTeachers faqat TeachersProvider ichida ishlatiladi");
  return ctx;
}

export function NewTeacherButton() {
  const { openCreate } = useTeachers();
  return (
    <button
      type="button"
      onClick={openCreate}
      className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
    >
      <Plus size={16} aria-hidden="true" />
      Xodim qo&apos;shish
    </button>
  );
}
