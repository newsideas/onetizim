"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, UserPlus } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { NewStudentModal } from "@/components/students/NewStudentButton";
import type { LeadOptions, LeadRow } from "@/components/leads/LeadsProvider";
import {
  convertLeadToStudent,
  createLead,
  deleteLead,
  getLeadFormOptions,
  updateLead,
  type LeadFormOptions,
} from "@/lib/actions/leads";
import { unwrap } from "@/lib/actions/result";
import {
  INTEREST_LEVELS,
  INTEREST_LEVEL_LABELS,
  LEAD_STAGES,
  LEAD_STAGE_LABELS,
  LESSON_DAY_OPTIONS,
  type InterestLevel,
  type LeadStage,
} from "@/lib/validations/lead";

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none disabled:opacity-60";

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-muted">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

const EMPTY_OPTIONS: LeadFormOptions = { students: [], courses: [], teachers: [], groups: [] };

/**
 * Edu tizimdagi "Yangi buyurtma" oynasi (o'ngdan chiqadigan panel): mavjud o'quvchi tanlanadi,
 * kurs, dars kuni va vaqti, o'qituvchi, yig'ilayotgan guruh, birinchi darsga kelish vaqti.
 * Tahrirlashda bosqich, manba, menejer va qo'ng'iroq sanasi kabi qo'shimcha maydonlar ham chiqadi.
 */
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
  const [studentId, setStudentId] = useState(lead?.student_id ?? "");
  const [formOptions, setFormOptions] = useState<LeadFormOptions>(EMPTY_OPTIONS);
  const [addingStudent, setAddingStudent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [values, setValues] = useState({
    fullName: lead?.full_name ?? "",
    parentName: lead?.parent_name ?? "",
    phone: lead?.phone ?? "",
    source: lead?.source ?? "",
    interest: lead?.interest ?? "",
    stage: lead?.stage ?? defaultStage,
    assignedTo: lead?.assigned_to ?? "",
    trialDate: lead?.trial_date ?? "",
    trialTime: lead?.trial_time?.slice(0, 5) ?? "",
    interestLevel: (lead?.interest_level ?? "") as InterestLevel | "",
    nextContactOn: lead?.next_contact_on ?? "",
    note: lead?.note ?? "",
    referralStudentId: lead?.referral_student_id ?? "",
    lessonDays: lead?.lesson_days ?? "",
    lessonTime: lead?.lesson_time?.slice(0, 5) ?? "",
    teacherId: lead?.teacher_id ?? "",
    groupId: lead?.group_id ?? "",
  });

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  // Tanlov ro'yxatlari (o'quvchilar, kurslar, o'qituvchilar, guruhlar) panel ochilganda yuklanadi.
  useEffect(() => {
    getLeadFormOptions()
      .then((result) => setFormOptions(unwrap(result)))
      .catch(() => setFormOptions(EMPTY_OPTIONS));
  }, []);

  const studentOptions = useMemo(
    () =>
      formOptions.students.map((s) => ({
        value: s.id,
        label: s.phone ? `${s.name} — ${s.phone}` : s.name,
      })),
    [formOptions.students],
  );
  const courseOptions = useMemo(() => {
    const names = new Set(formOptions.courses);
    // Eski lidlarda kurs erkin matn edi — u ham ro'yxatda ko'rinsin.
    if (values.interest) names.add(values.interest);
    return [...names];
  }, [formOptions.courses, values.interest]);

  /** Mavjud o'quvchiga bog'lanmagan (eski) lidlar tahrirlashda eski maydonlar bilan ochiladi. */
  const legacy = Boolean(lead) && !lead?.student_id && !studentId;

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

    let fullName = values.fullName;
    if (!legacy) {
      const student = formOptions.students.find((s) => s.id === studentId);
      if (!studentId) return setError("O'quvchini tanlang");
      if (!values.interest) return setError("Kursni tanlang");
      if (!values.lessonDays) return setError("Dars kunini tanlang");
      fullName = student?.name ?? fullName;
    } else if (values.fullName.trim().length < 2) {
      return setError("Bolaning ism familiyasini kiriting");
    }

    const payload = { ...values, fullName, studentId };
    run(() => (lead ? updateLead(lead.id, payload) : createLead(payload)));
  }

  function remove() {
    if (!lead) return;
    run(() => deleteLead(lead.id));
  }

  function convert() {
    if (!lead) return;
    setError(undefined);
    startTransition(async () => {
      const result = await convertLeadToStudent(lead.id);
      if (!result.ok) return setError(result.error);
      setStudentId(result.data);
      set("stage", "enrolled");
      router.refresh();
    });
  }

  function studentCreated(student: { id: string; name: string }) {
    setFormOptions((prev) => ({
      ...prev,
      students: [...prev.students, { id: student.id, name: student.name, phone: null }],
    }));
    setStudentId(student.id);
  }

  return (
    <>
      <Drawer open onClose={isPending ? () => {} : onClose} title={lead ? "Buyurtmani tahrirlash" : "Yangi buyurtma"}>
        <form onSubmit={submit} className="space-y-3" noValidate>
          <p className="text-xs text-ink-faint">* Zarurligini bildiradi</p>

          {legacy ? (
            <>
              <Field label="Bola F.I.Sh." htmlFor="lead-name" required>
                <input
                  id="lead-name"
                  value={values.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  maxLength={120}
                  disabled={isPending}
                  className={inputClass}
                />
              </Field>
              <Field label="Ota-ona F.I.Sh." htmlFor="lead-parent">
                <input
                  id="lead-parent"
                  value={values.parentName}
                  onChange={(e) => set("parentName", e.target.value)}
                  maxLength={120}
                  disabled={isPending}
                  className={inputClass}
                />
              </Field>
              <Field label="Ota-ona telefoni" htmlFor="lead-phone">
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
            </>
          ) : (
            <>
              {!lead && (
                <button
                  type="button"
                  onClick={() => setAddingStudent(true)}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
                >
                  O&apos;quvchi qo&apos;shish
                </button>
              )}
              <Field label="O'quvchi" htmlFor="lead-student" required>
                <SearchSelect
                  id="lead-student"
                  value={studentId}
                  onChange={setStudentId}
                  options={studentOptions}
                  placeholder="O'quvchini qidirish"
                  disabled={isPending || Boolean(lead?.student_id)}
                />
              </Field>
            </>
          )}

          <Field label="Referal bergan o'quvchi" htmlFor="lead-referral">
            <SearchSelect
              id="lead-referral"
              value={values.referralStudentId}
              onChange={(v) => set("referralStudentId", v)}
              options={studentOptions}
              placeholder="O'quvchini qidirish"
              disabled={isPending}
            />
          </Field>

          <Field label="Kurs" htmlFor="lead-course" required={!legacy}>
            <select
              id="lead-course"
              value={values.interest}
              onChange={(e) => set("interest", e.target.value)}
              disabled={isPending}
              className={inputClass}
            >
              <option value="">Kursni tanlang</option>
              {courseOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Dars kunini tanlang" htmlFor="lead-days" required={!legacy}>
            <select
              id="lead-days"
              value={values.lessonDays}
              onChange={(e) => set("lessonDays", e.target.value)}
              disabled={isPending}
              className={inputClass}
            >
              <option value="">Tanlang</option>
              {LESSON_DAY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Darsning boshlanish vaqtini tanlang" htmlFor="lead-lesson-time">
            <input
              id="lead-lesson-time"
              type="time"
              value={values.lessonTime}
              onChange={(e) => set("lessonTime", e.target.value)}
              disabled={isPending}
              className={inputClass}
            />
          </Field>

          <Field label="O'qituvchi" htmlFor="lead-teacher">
            <select
              id="lead-teacher"
              value={values.teacherId}
              onChange={(e) => set("teacherId", e.target.value)}
              disabled={isPending}
              className={inputClass}
            >
              <option value="">Ustozni tanlang</option>
              {formOptions.teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Yig'ilayotgan guruhni tanlang" htmlFor="lead-group">
            <select
              id="lead-group"
              value={values.groupId}
              onChange={(e) => set("groupId", e.target.value)}
              disabled={isPending}
              className={inputClass}
            >
              <option value="">Yig&apos;ilayotgan guruhni tanlang</option>
              {formOptions.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Birinchi darsga kelish sanasi" htmlFor="lead-trial">
            <input
              id="lead-trial"
              type="date"
              value={values.trialDate}
              onChange={(e) => set("trialDate", e.target.value)}
              disabled={isPending}
              className={inputClass}
            />
          </Field>

          <Field label="Birinchi darsga kelish vaqti" htmlFor="lead-trial-time">
            <input
              id="lead-trial-time"
              type="time"
              value={values.trialTime}
              onChange={(e) => set("trialTime", e.target.value)}
              disabled={isPending}
              className={inputClass}
            />
          </Field>

          <Field label="Izoh" htmlFor="lead-note">
            <input
              id="lead-note"
              placeholder="Izoh"
              value={values.note}
              onChange={(e) => set("note", e.target.value)}
              maxLength={2000}
              disabled={isPending}
              className={inputClass}
            />
          </Field>

          {lead && (
            <div className="space-y-3 border-t border-line pt-3">
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
              <Field label="Qiziqish darajasi" htmlFor="lead-level">
                <select
                  id="lead-level"
                  value={values.interestLevel}
                  onChange={(e) => set("interestLevel", e.target.value as InterestLevel | "")}
                  disabled={isPending}
                  className={inputClass}
                >
                  <option value="">Belgilanmagan</option>
                  {INTEREST_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {INTEREST_LEVEL_LABELS[level]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Keyingi qo'ng'iroq sanasi" htmlFor="lead-next">
                <input
                  id="lead-next"
                  type="date"
                  value={values.nextContactOn}
                  onChange={(e) => set("nextContactOn", e.target.value)}
                  disabled={isPending}
                  className={inputClass}
                />
              </Field>

              <div className="rounded-lg bg-canvas px-3 py-2.5 text-sm">
                {lead.student_id || studentId ? (
                  <span className="text-ink-muted">
                    O&apos;quvchilar bazasiga qo&apos;shilgan.{" "}
                    <Link
                      href={`/education/students/${lead.student_id ?? studentId}`}
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
            </div>
          )}

          <FormError message={error} />

          {confirmDelete && (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
              <span>Buyurtmani o&apos;chirmoqchimisiz?</span>
              <span className="flex gap-2">
                <button type="button" onClick={() => setConfirmDelete(false)} className="font-medium hover:underline">
                  Yo&apos;q
                </button>
                <button type="button" onClick={remove} disabled={isPending} className="font-semibold hover:underline">
                  Ha, o&apos;chirish
                </button>
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            {lead && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={isPending}
                className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-red-50 hover:text-red-600"
                aria-label="Buyurtmani o'chirish"
                title="O'chirish"
              >
                <Trash2 size={16} />
              </button>
            )}
            <Button type="button" variant="secondary" className="ml-auto flex-1" onClick={onClose} disabled={isPending}>
              Orqaga
            </Button>
            <Button type="submit" className="flex-[2]" disabled={isPending}>
              {isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </form>
      </Drawer>

      <NewStudentModal open={addingStudent} onClose={() => setAddingStudent(false)} onCreated={studentCreated} />
    </>
  );
}
