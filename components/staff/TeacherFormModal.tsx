"use client";

import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { financeInputClass } from "@/components/finance/MoneyEntryModal";
import { createTeacher, getTeacherFormOptions, updateTeacher } from "@/lib/actions/staff";
import { unwrap } from "@/lib/actions/result";
import { SALARY_TYPE_LABELS } from "@/lib/validations/finance";
import {
  GENDERS,
  TEACHER_KIND_LABELS,
  type TeacherKind,
} from "@/lib/validations/staff";
import type { SalaryType } from "@/types/database";
import type { TeacherRow } from "@/components/staff/TeachersProvider";

function Field({
  label,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Telefon raqamdan +998 va bo'sh joylarni olib tashlaydi (formada faqat qolgan raqamlar ko'rinadi). */
function stripCode(phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.startsWith("998") ? digits.slice(3) : digits;
}

/** "Familiya Ism" ko'rinishidagi to'liq ismni ikkiga ajratadi. */
function splitName(fullName: string | undefined): { lastName: string; firstName: string } {
  const [lastName = "", ...rest] = (fullName ?? "").trim().split(/\s+/);
  return { lastName, firstName: rest.join(" ") };
}

/**
 * Edu tizimdagi "Xodim qo'shish" oynasi: shaxsiy ma'lumotlar, vazifa, "Ish haqi chiqarish"
 * belgisi (maosh turi va stavka), ish jadvali, izoh va elektron pochta.
 */
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
  const [schedules, setSchedules] = useState<{ id: string; name: string }[]>([]);

  const initialName = splitName(teacher?.full_name);
  const [lastName, setLastName] = useState(initialName.lastName);
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [phone, setPhone] = useState(stripCode(teacher?.phone));
  const [kind, setKind] = useState<TeacherKind | "">(teacher?.kind ?? "");
  const [gender, setGender] = useState(teacher?.gender ?? "");
  const [birthDate, setBirthDate] = useState(teacher?.birth_date ?? "");
  const [paysSalary, setPaysSalary] = useState(teacher?.pays_salary ?? false);
  const [salaryType, setSalaryType] = useState<SalaryType | "">(teacher?.salary_type ?? "");
  const [rate, setRate] = useState(teacher?.rate != null ? String(teacher.rate) : "");
  const [workScheduleId, setWorkScheduleId] = useState(teacher?.work_schedule_id ?? "");
  const [comment, setComment] = useState(teacher?.comment ?? "");
  const [email, setEmail] = useState(teacher?.email ?? "");

  useEffect(() => {
    getTeacherFormOptions()
      .then((result) => setSchedules(unwrap(result)))
      .catch(() => setSchedules([]));
  }, []);

  // Yangi xodimda faqat O'qituvchi va Moderator; "Ma'muriyat" faqat shu toifadagi xodimni tahrirlashda.
  const kinds: TeacherKind[] = teacher?.kind === "admin" ? ["teacher", "manager", "admin"] : ["teacher", "manager"];

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!firstName.trim()) return setError("Ismni kiriting");
    if (!lastName.trim()) return setError("Familiyani kiriting");
    if (!phone.trim()) return setError("Telefon raqamni kiriting");
    if (!kind) return setError("O'quv markazidagi vazifasini tanlang");

    setError(undefined);
    startTransition(async () => {
      const values = {
        fullName: `${lastName.trim()} ${firstName.trim()}`,
        phone: `+998${phone.replace(/\s/g, "")}`,
        position: teacher?.position ?? undefined,
        kind,
        salaryType: paysSalary ? salaryType || undefined : undefined,
        rate: paysSalary && rate.trim() ? Number(rate) : undefined,
        gender: gender as "" | (typeof GENDERS)[number],
        birthDate,
        paysSalary,
        workScheduleId,
        comment,
        email,
      };
      const result = teacher ? await updateTeacher(teacher.id, values) : await createTeacher(values);
      if (!result.ok) return setError(result.error);
      router.refresh();
      onClose();
    });
  }

  const inputClass = financeInputClass;

  return (
    <Modal wide open onClose={isPending ? () => {} : onClose} title={teacher ? "Xodimni tahrirlash" : "Xodim qo'shish"}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Ism*" htmlFor="staff-first">
            <input
              id="staff-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              maxLength={60}
              disabled={isPending}
              className={inputClass}
            />
          </Field>
          <Field label="Familiya*" htmlFor="staff-last">
            <input
              id="staff-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              maxLength={60}
              disabled={isPending}
              className={inputClass}
            />
          </Field>
          <Field label="Telefon raqam*" htmlFor="staff-phone">
            <div className="flex">
              <span className="inline-flex items-center rounded-l-lg border border-r-0 border-line bg-canvas px-3 text-sm text-ink-muted">
                +998
              </span>
              <input
                id="staff-phone"
                type="tel"
                inputMode="numeric"
                placeholder="90 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, ""))}
                disabled={isPending}
                className={`${inputClass} rounded-l-none`}
              />
            </div>
          </Field>

          <Field label="O'quv markazidagi vazifasi*" htmlFor="staff-kind">
            <select
              id="staff-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as TeacherKind | "")}
              disabled={isPending}
              className={inputClass}
            >
              <option value="">Tanlang</option>
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {TEACHER_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Jinsi" htmlFor="staff-gender">
            <select
              id="staff-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              disabled={isPending}
              className={inputClass}
            >
              <option value="">Jinsini tanlang</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tug'ilgan sanasi" htmlFor="staff-birth">
            <input
              id="staff-birth"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              disabled={isPending}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="border-t border-line pt-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-ink">
            <input
              type="checkbox"
              role="switch"
              checked={paysSalary}
              onChange={(e) => setPaysSalary(e.target.checked)}
              disabled={isPending}
              className="h-4 w-8 accent-brand-600"
            />
            Ish haqi chiqarish
          </label>
        </div>

        <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
          <Field label="Ish jadvali" htmlFor="staff-schedule">
            <select
              id="staff-schedule"
              value={workScheduleId}
              onChange={(e) => setWorkScheduleId(e.target.value)}
              disabled={isPending}
              className={inputClass}
            >
              <option value="">Ish jadvali</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          {paysSalary && (
            <>
              <Field label="Maosh turi" htmlFor="staff-salary-type">
                <select
                  id="staff-salary-type"
                  value={salaryType}
                  onChange={(e) => setSalaryType(e.target.value as SalaryType | "")}
                  disabled={isPending}
                  className={inputClass}
                >
                  <option value="">Tanlang</option>
                  {Object.entries(SALARY_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label={
                  salaryType === "percent"
                    ? "Ish haqi (%)"
                    : salaryType === "per_lesson"
                      ? "Ish haqi (dars uchun)"
                      : "Ish haqi"
                }
                htmlFor="staff-rate"
              >
                <input
                  id="staff-rate"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={salaryType === "percent" ? 0.5 : 1}
                  placeholder="Ish haqini kiriting"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  disabled={isPending || !salaryType}
                  className={inputClass}
                />
              </Field>
            </>
          )}
        </div>

        <Field label="Izoh" htmlFor="staff-comment" className="border-t border-line pt-4">
          <input
            id="staff-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            disabled={isPending}
            className={inputClass}
          />
        </Field>

        <Field label="Elektron pochta" htmlFor="staff-email" className="sm:max-w-xs">
          <input
            id="staff-email"
            type="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            className={inputClass}
          />
        </Field>

        <FormError message={error} />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Orqaga
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
