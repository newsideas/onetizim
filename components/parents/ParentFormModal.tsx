"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { financeInputClass } from "@/components/finance/MoneyEntryModal";
import { createParent, updateParent } from "@/lib/actions/parents";
import { RELATIONS } from "@/lib/validations/student";

export interface ParentFormValues {
  id: string;
  fullName: string;
  relation: string;
  phone: string;
  note: string;
  studentIds: string[];
}

export interface StudentOption {
  id: string;
  full_name: string;
}

const labelClass = "mb-1.5 block text-xs font-medium text-ink-muted";

/** `parent` berilsa tahrirlash, berilmasa yangi ota-ona. */
export function ParentFormModal({
  students,
  parent,
  onClose,
}: {
  students: StudentOption[];
  parent?: ParentFormValues;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const [fullName, setFullName] = useState(parent?.fullName ?? "");
  const [relation, setRelation] = useState(parent?.relation ?? "");
  const [phone, setPhone] = useState(parent?.phone ?? "");
  const [note, setNote] = useState(parent?.note ?? "");
  const [studentIds, setStudentIds] = useState<string[]>(parent?.studentIds ?? []);

  function toggleStudent(id: string) {
    setStudentIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const values = { fullName, relation, phone, note, studentIds };
      const result = parent ? await updateParent(parent.id, values) : await createParent(values);
      if (!result.ok) return setError(result.error);
      router.refresh();
      onClose();
    });
  }

  return (
    <Modal
      open
      onClose={isPending ? () => {} : onClose}
      title={parent ? "Ota-onani tahrirlash" : "Yangi ota-ona"}
    >
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div>
          <label htmlFor="parent-name" className={labelClass}>
            F.I.Sh. <span className="text-red-500">*</span>
          </label>
          <input
            id="parent-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={120}
            autoFocus
            disabled={isPending}
            className={financeInputClass}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="parent-relation" className={labelClass}>
              Qarindoshlik
            </label>
            <select
              id="parent-relation"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              disabled={isPending}
              className={financeInputClass}
            >
              <option value="">Tanlang</option>
              {RELATIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="parent-phone" className={labelClass}>
              Telefon
            </label>
            <input
              id="parent-phone"
              type="tel"
              inputMode="tel"
              placeholder="+998"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={30}
              disabled={isPending}
              className={financeInputClass}
            />
          </div>
        </div>

        <div>
          <span className={labelClass}>Farzandlari</span>
          {students.length === 0 ? (
            <p className="text-sm text-ink-faint">Hali o&apos;quvchi yo&apos;q.</p>
          ) : (
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
              {students.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={studentIds.includes(s.id)}
                    onChange={() => toggleStudent(s.id)}
                    disabled={isPending}
                  />
                  {s.full_name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="parent-note" className={labelClass}>
            Izoh
          </label>
          <textarea
            id="parent-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={2}
            disabled={isPending}
            className={financeInputClass}
          />
        </div>

        <FormError message={error} />

        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Bekor qilish
          </Button>
        </div>
      </form>
    </Modal>
  );
}
