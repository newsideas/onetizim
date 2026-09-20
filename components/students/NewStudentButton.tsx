"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { unwrap } from "@/lib/actions/result";
import {
  createStudentQuick,
  getStudentFormOptions,
  updateStudentQuick,
  type StudentFormOptions,
} from "@/lib/actions/students";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

const EMPTY = {
  firstName: "",
  lastName: "",
  fatherName: "",
  phone: "",
  email: "",
  categoryId: "",
  birthDate: "",
  paymentDate: "",
  marketingCampaignId: "",
  studyLanguage: "",
  fatherPhone: "",
  motherName: "",
  motherPhone: "",
};

/** +998 qo'yilgan telefon maydoni: foydalanuvchi faqat qolgan raqamlarni yozadi. */
function PhoneInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex">
      <span className="inline-flex items-center rounded-l-lg border border-r-0 border-line bg-canvas px-3 text-sm text-ink-muted">
        +998
      </span>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        placeholder="90 123 45 67"
        className="rounded-l-none"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d ]/g, ""))}
      />
    </div>
  );
}

function withCode(digits: string): string {
  const clean = digits.replace(/\s/g, "");
  return clean ? `+998${clean}` : "";
}

/** Bazadagi "+998901234567" ni maydonga tushadigan "901234567" ga qaytaradi. */
function withoutCode(stored: string | undefined): string {
  return (stored ?? "").replace(/^\+?998/, "").replace(/\D/g, "");
}

export type StudentEditValues = Partial<typeof EMPTY>;

/** Tahrirlash uchun boshlang'ich qiymatlar: telefonlar +998 siz, bo'sh maydonlar "". */
function initialValues(values?: StudentEditValues): typeof EMPTY {
  const merged = { ...EMPTY, ...values };
  return {
    ...merged,
    phone: withoutCode(merged.phone),
    fatherPhone: withoutCode(merged.fatherPhone),
    motherPhone: withoutCode(merged.motherPhone),
  };
}

/**
 * Edu tizimdagi "Yangi o'quvchi qo'shish" oynasi. O'quvchilar ro'yxatidan ham, buyurtma
 * oynasidagi "O'quvchi qo'shish" tugmasidan ham ochiladi (`onCreated` yangi o'quvchini qaytaradi).
 */
export function NewStudentModal({
  open,
  onClose,
  onCreated,
  student,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (student: { id: string; name: string }) => void;
  /** Berilsa oyna tahrirlash rejimida ochiladi ("O'quvchini tahrirlash"). */
  student?: { id: string; values: StudentEditValues };
}) {
  const router = useRouter();
  const [values, setValues] = useState(() => initialValues(student?.values));
  const [extra, setExtra] = useState(() =>
    Boolean(student?.values.fatherPhone || student?.values.motherName || student?.values.motherPhone),
  );
  const [options, setOptions] = useState<StudentFormOptions | null>(null);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof EMPTY) => (value: string) => setValues((v) => ({ ...v, [key]: value }));
  const bind = (key: keyof typeof EMPTY) => ({
    value: values[key],
    onChange: (e: { target: { value: string } }) => set(key)(e.target.value),
  });

  // Tanlov ro'yxatlari oyna birinchi ochilganda bir marta yuklanadi.
  useEffect(() => {
    if (!open || options) return;
    getStudentFormOptions()
      .then((result) => setOptions(unwrap(result)))
      .catch(() => setOptions({ categories: [], campaigns: [], languages: [] }));
  }, [open, options]);

  function close() {
    setValues(EMPTY);
    setExtra(false);
    setError(undefined);
    onClose();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSaving(true);
    try {
      const payload = {
        ...values,
        phone: withCode(values.phone),
        fatherPhone: withCode(values.fatherPhone),
        motherPhone: withCode(values.motherPhone),
      };
      if (student) {
        unwrap(await updateStudentQuick(student.id, payload));
        close();
        router.refresh();
        return;
      }
      const id = unwrap(await createStudentQuick(payload));
      const name = [values.lastName.trim(), values.firstName.trim()].filter(Boolean).join(" ");
      close();
      router.refresh();
      onCreated?.({ id, name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={close} title={student ? "O'quvchini tahrirlash" : "Yangi o'quvchi qo'shish"}>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <p className="text-xs text-ink-faint">* Zarurligini bildiradi</p>

        <div>
          <Label htmlFor="ns-first">
            Ism<span className="ml-0.5 text-red-500">*</span>
          </Label>
          <Input id="ns-first" placeholder="Ism" {...bind("firstName")} />
        </div>
        <div>
          <Label htmlFor="ns-last">Familiya</Label>
          <Input id="ns-last" placeholder="Familiya" {...bind("lastName")} />
        </div>
        <div>
          <Label htmlFor="ns-father">Otasining ismi</Label>
          <Input id="ns-father" {...bind("fatherName")} />
        </div>
        <div>
          <Label htmlFor="ns-phone">Telefon raqam</Label>
          <PhoneInput id="ns-phone" value={values.phone} onChange={set("phone")} />
        </div>
        <div>
          <Label htmlFor="ns-email">Elektron pochta</Label>
          <Input id="ns-email" type="email" placeholder="example@gmail.com" {...bind("email")} />
        </div>
        <div>
          <Label htmlFor="ns-category">Kategoriyani tanlang</Label>
          <Select id="ns-category" {...bind("categoryId")}>
            <option value="">Kategoriyani tanlang</option>
            {options?.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="ns-birth">Tug&apos;ilgan sanasi</Label>
          <Input id="ns-birth" type="date" {...bind("birthDate")} />
        </div>
        <div>
          <Label htmlFor="ns-payment">O&apos;quvchining pul to&apos;lash sanasi</Label>
          <Input id="ns-payment" type="date" {...bind("paymentDate")} />
        </div>
        <div>
          <Label htmlFor="ns-marketing">Marketing so&apos;rovnomasi</Label>
          <Select id="ns-marketing" {...bind("marketingCampaignId")}>
            <option value="">Marketing so&apos;rovnomasini tanlang</option>
            {options?.campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="ns-language">O&apos;qish tili</Label>
          <Select id="ns-language" {...bind("studyLanguage")}>
            <option value="">Tilni tanlang</option>
            {options?.languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={extra}
            onChange={(e) => setExtra(e.target.checked)}
            className="h-4 w-4 rounded border-line"
          />
          Qo&apos;shimcha ma&apos;lumotlar
        </label>

        {extra && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="ns-father-phone">Otasining telefon raqami</Label>
              <PhoneInput id="ns-father-phone" value={values.fatherPhone} onChange={set("fatherPhone")} />
            </div>
            <div>
              <Label htmlFor="ns-mother">Onasining ismi</Label>
              <Input id="ns-mother" {...bind("motherName")} />
            </div>
            <div>
              <Label htmlFor="ns-mother-phone">Onasining telefon raqami</Label>
              <PhoneInput id="ns-mother-phone" value={values.motherPhone} onChange={set("motherPhone")} />
            </div>
          </div>
        )}

        <FormError message={error} />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={close}>
            Orqaga
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** O'quvchilar ro'yxatidagi "O'quvchi qo'shish" tugmasi. */
export function NewStudentButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
      >
        <Plus size={16} />
        O&apos;quvchi qo&apos;shish
      </button>
      <NewStudentModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/**
 * O'quvchi kartasidagi "Tahrirlash" tugmasi: oyna faqat ochiq paytda qurilgani uchun har safar
 * eng so'nggi qiymatlar bilan ochiladi.
 */
export function EditStudentButton({ studentId, values }: { studentId: string; values: StudentEditValues }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
      >
        <Pencil size={15} />
        Tahrirlash
      </button>
      {open && <NewStudentModal open onClose={() => setOpen(false)} student={{ id: studentId, values }} />}
    </>
  );
}
