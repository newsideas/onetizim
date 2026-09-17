"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { financeInputClass } from "@/components/finance/MoneyEntryModal";
import { createTeacher, updateTeacher } from "@/lib/actions/staff";
import { SALARY_TYPE_LABELS } from "@/lib/validations/finance";
import { TEACHER_KINDS, TEACHER_KIND_LABELS, type TeacherKind } from "@/lib/validations/staff";
import type { SalaryType } from "@/types/database";
import type { TeacherRow } from "@/components/staff/TeachersProvider";

export function TeacherFormModal({
  teacher,
  onClose,
}: {
  teacher: TeacherRow | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const [fullName, setFullName] = useState(teacher?.full_name ?? "");
  const [phone, setPhone] = useState(teacher?.phone ?? "");
  const [position, setPosition] = useState(teacher?.position ?? "");
  const [kind, setKind] = useState<TeacherKind>(teacher?.kind ?? "teacher");
  const [salaryType, setSalaryType] = useState<SalaryType | "">(teacher?.salary_type ?? "");
  const [rate, setRate] = useState(teacher?.rate != null ? String(teacher.rate) : "");

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (fullName.trim().length < 2) return setError("Ism familiyani kiriting");

    setError(undefined);
    startTransition(async () => {
      const values = {
        fullName,
        phone,
        position,
        kind,
        salaryType: salaryType || undefined,
        rate: rate.trim() ? Number(rate) : undefined,
      };
      const result = teacher ? await updateTeacher(teacher.id, values) : await createTeacher(values);
      if (!result.ok) return setError(result.error);
      router.refresh();
      onClose();
    });
  }

  return (
    <Modal open onClose={isPending ? () => {} : onClose} title={teacher ? "Xodimni tahrirlash" : "Yangi xodim"}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label htmlFor="teacher-name" className="mb-1.5 block text-xs font-medium text-ink-muted">
            Ism familiya <span className="text-red-500">*</span>
          </label>
          <input
            id="teacher-name"
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
            <label htmlFor="teacher-phone" className="mb-1.5 block text-xs font-medium text-ink-muted">
              Telefon
            </label>
            <input
              id="teacher-phone"
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
          <div>
            <label htmlFor="teacher-kind" className="mb-1.5 block text-xs font-medium text-ink-muted">
              Toifa
            </label>
            <select
              id="teacher-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as TeacherKind)}
              disabled={isPending}
              className={financeInputClass}
            >
              {TEACHER_KINDS.map((k) => (
                <option key={k} value={k}>
                  {TEACHER_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="teacher-position" className="mb-1.5 block text-xs font-medium text-ink-muted">
            Lavozim
          </label>
          <input
            id="teacher-position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            maxLength={80}
            placeholder="Masalan: Ingliz tili o'qituvchisi"
            disabled={isPending}
            className={financeInputClass}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="teacher-salary-type" className="mb-1.5 block text-xs font-medium text-ink-muted">
              Maosh turi
            </label>
            <select
              id="teacher-salary-type"
              value={salaryType}
              onChange={(e) => setSalaryType(e.target.value as SalaryType | "")}
              disabled={isPending}
              className={financeInputClass}
            >
              <option value="">Belgilanmagan</option>
              {Object.entries(SALARY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="teacher-rate" className="mb-1.5 block text-xs font-medium text-ink-muted">
              Stavka
              {salaryType === "percent" && " (%)"}
              {salaryType === "per_lesson" && " (dars uchun, so'm)"}
              {salaryType === "fixed" && " (oyiga, so'm)"}
            </label>
            <input
              id="teacher-rate"
              type="number"
              inputMode="numeric"
              min={0}
              step={salaryType === "percent" ? 0.5 : 1}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              disabled={isPending || !salaryType}
              className={financeInputClass}
            />
          </div>
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
