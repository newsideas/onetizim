"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { ContractFormModal } from "@/components/contracts/ContractFormModal";

export interface Option {
  id: string;
  label: string;
}

export interface DiscountOption extends Option {
  discount_type: string | null;
  amount: number;
}

export interface AmountPreset extends Option {
  amount: number;
  academic_year_id: string | null;
}

export interface ContractFormOptions {
  orgId: string;
  students: Option[];
  contractTypes: Option[];
  academicYears: Option[];
  discounts: DiscountOption[];
  amountPresets: AmountPreset[];
}

/** Tahrirlash formasi uchun kerakli ustunlar (serverdan keladi). */
export interface EditableContract {
  id: string;
  student_id: string;
  contract_number: string | null;
  contract_type_id: string | null;
  academic_year_id: string | null;
  discount_id: string | null;
  base_amount: number;
  file_path: string | null;
  file_name: string | null;
}

interface ContractsContextValue {
  openCreate: () => void;
  openEdit: (contract: EditableContract) => void;
}

const ContractsContext = createContext<ContractsContextValue | null>(null);

/**
 * Sarlavhadagi "Qo'shish" tugmasi va jadval qatorlaridagi "Tahrirlash"
 * bitta modalni boshqaradi — ular sahifaning turli joylarida bo'lgani
 * uchun holat shu yerda turadi.
 */
export function ContractsProvider({
  options,
  children,
}: {
  options: ContractFormOptions;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditableContract | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setOpen(true);
  }, []);

  const openEdit = useCallback((contract: EditableContract) => {
    setEditing(contract);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return (
    <ContractsContext.Provider value={{ openCreate, openEdit }}>
      {children}
      {open && (
        <ContractFormModal
          key={editing?.id ?? "new"}
          options={options}
          contract={editing}
          onClose={close}
        />
      )}
    </ContractsContext.Provider>
  );
}

export function useContracts(): ContractsContextValue {
  const ctx = useContext(ContractsContext);
  if (!ctx) throw new Error("useContracts faqat ContractsProvider ichida ishlatiladi");
  return ctx;
}

export function NewContractButton() {
  const { openCreate } = useContracts();

  return (
    <button
      type="button"
      onClick={openCreate}
      className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
    >
      <Plus size={16} />
      Qo&apos;shish
    </button>
  );
}
