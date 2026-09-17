/**
 * Ma'lumotnomalar ro'yxati — My School'dagi Sozlamalar va O'quv bo'limi
 * sahifalari.
 *
 * Har bir ma'lumotnoma shu yerda bir marta tasvirlanadi: jadval nomi,
 * maydonlar va ular jadvalda qanday ko'rinishi. Sahifa, forma va server
 * action shu tavsifdan ishlaydi, shuning uchun yangi ma'lumotnoma
 * qo'shish — shu faylga bitta yozuv qo'shish demakdir.
 *
 * Xavfsizlik: server action faqat shu ro'yxatdagi jadval va maydonlarni
 * qabul qiladi — brauzer ixtiyoriy jadval yoki ustun nomini yubora olmaydi.
 */

export type FieldType = "text" | "number" | "date" | "time" | "boolean" | "select";

/**
 * Ma'lumotnoma kalitlari alohida ro'yxatda — `REFERENCES` obyektining
 * o'zidan chiqarilmaydi, aks holda `RefField.ref` shu tur orqali
 * `REFERENCES`ga, `REFERENCES` esa `RefField`ga bog'lanib, sikllik
 * hosil bo'ladi.
 */
export const REFERENCE_KEYS = [
  "academic-years",
  "class-types",
  "shifts",
  "academic-languages",
  "buildings",
  "classrooms",
  "subjects",
  "lesson-times",
  "academic-periods",
  "trainings",
  "contract-types",
  "contract-discounts",
  "bank-accounts",
  "contract-amounts",
] as const;

export type ReferenceKey = (typeof REFERENCE_KEYS)[number];

export interface RefField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Oddiy tanlov variantlari. */
  options?: string[];
  /** Boshqa ma'lumotnomadan tanlash (id saqlanadi, nomi ko'rsatiladi). */
  ref?: ReferenceKey;
}

export interface ReferenceConfig {
  table: string;
  path: string;
  title: string;
  subtitle: string;
  /** Qatorni boshqa ma'lumotnomalarda ko'rsatish uchun ustun. */
  labelField: string;
  orderBy: { column: string; ascending: boolean };
  fields: RefField[];
}

export const REFERENCES = {
  "academic-years": {
    table: "academic_years",
    path: "/settings/academic-years",
    title: "O'quv yillari",
    subtitle: "O'quv yillari ro'yxati",
    labelField: "name",
    orderBy: { column: "start_date", ascending: false },
    fields: [
      { name: "name", label: "O'quv yili", type: "text", required: true },
      {
        name: "education_type",
        label: "Ta'lim turi",
        type: "select",
        options: ["Kunduzgi", "Kechki", "Sirtqi", "Masofaviy"],
      },
      { name: "start_date", label: "Boshlanish sanasi", type: "date", required: true },
      { name: "end_date", label: "Tugash sanasi", type: "date", required: true },
      { name: "is_current", label: "Joriy o'quv yili", type: "boolean" },
    ],
  },

  "class-types": {
    table: "class_types",
    path: "/settings/class-types",
    title: "Sinf turlari",
    subtitle: "Turlar ro'yxati",
    labelField: "name",
    orderBy: { column: "name", ascending: true },
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "code", label: "Kodi", type: "text" },
      { name: "note", label: "Izoh", type: "text" },
    ],
  },

  shifts: {
    table: "shifts",
    path: "/settings/smena",
    title: "Smenalar",
    subtitle: "Smenalar ro'yxati",
    labelField: "name",
    orderBy: { column: "start_time", ascending: true },
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "start_time", label: "Boshlanishi", type: "time" },
      { name: "end_time", label: "Tugashi", type: "time" },
    ],
  },

  "academic-languages": {
    table: "academic_languages",
    path: "/settings/academic-languages",
    title: "Ta'lim tillari",
    subtitle: "Tillar ro'yxati",
    labelField: "name",
    orderBy: { column: "name", ascending: true },
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "code", label: "Kodi", type: "text" },
    ],
  },

  buildings: {
    table: "buildings",
    path: "/education/buildings",
    title: "Binolar",
    subtitle: "Binolar ro'yxati",
    labelField: "name",
    orderBy: { column: "name", ascending: true },
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "code", label: "Kodi", type: "text" },
      { name: "address", label: "Manzil", type: "text" },
    ],
  },

  classrooms: {
    table: "rooms",
    path: "/education/classrooms",
    title: "Auditoriyalar",
    subtitle: "Auditoriyalar ro'yxati",
    labelField: "name",
    orderBy: { column: "name", ascending: true },
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "code", label: "Kodi", type: "text" },
      { name: "building_id", label: "Bino nomi", type: "select", ref: "buildings" },
    ],
  },

  subjects: {
    table: "courses",
    path: "/education/subjects",
    title: "Fanlar",
    subtitle: "Fanlar ro'yxati",
    labelField: "name",
    orderBy: { column: "name", ascending: true },
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "code", label: "Kodi", type: "text" },
    ],
  },

  "lesson-times": {
    table: "lesson_times",
    path: "/education/lesson-times",
    title: "Dars vaqtlari",
    subtitle: "Dars vaqtlari ro'yxati",
    labelField: "position",
    orderBy: { column: "position", ascending: true },
    fields: [
      { name: "position", label: "Tartib raqami", type: "number", required: true },
      { name: "start_time", label: "Boshlanishi", type: "time", required: true },
      { name: "end_time", label: "Tugashi", type: "time", required: true },
      { name: "shift_id", label: "Smena", type: "select", ref: "shifts" },
    ],
  },

  "academic-periods": {
    table: "academic_periods",
    path: "/education/academic-periods",
    title: "Akademik davrlar",
    subtitle: "Davrlar ro'yxati",
    labelField: "name",
    orderBy: { column: "start_date", ascending: true },
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "academic_year_id", label: "O'quv yili", type: "select", ref: "academic-years" },
      { name: "start_date", label: "Boshlanish sanasi", type: "date" },
      { name: "end_date", label: "Tugash sanasi", type: "date" },
    ],
  },

  trainings: {
    table: "training_types",
    path: "/education/trainings",
    title: "Mashg'ulot turlari",
    subtitle: "Turlar ro'yxati",
    labelField: "name",
    orderBy: { column: "name", ascending: true },
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "code", label: "Kodi", type: "text" },
      { name: "note", label: "Izoh", type: "text" },
    ],
  },

  "contract-types": {
    table: "contract_types",
    path: "/contracts/types",
    title: "Shartnoma turlari",
    subtitle: "Turlar ro'yxati",
    labelField: "name",
    orderBy: { column: "name", ascending: true },
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "code", label: "Kodi", type: "text" },
      { name: "note", label: "Izoh", type: "text" },
    ],
  },

  "contract-discounts": {
    table: "contract_discounts",
    path: "/contracts/discounts",
    title: "Shartnoma chegirmalari",
    subtitle: "Chegirmalar ro'yxati",
    labelField: "name",
    orderBy: { column: "name", ascending: true },
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      {
        name: "discount_type",
        label: "Turi",
        type: "select",
        options: ["percent", "fixed"],
      },
      { name: "amount", label: "Miqdori", type: "number", required: true },
      { name: "note", label: "Izoh", type: "text" },
    ],
  },

  "bank-accounts": {
    table: "bank_accounts",
    path: "/contracts/audits",
    title: "Bank rekvizitlari",
    subtitle: "Rekvizitlar ro'yxati",
    labelField: "bank_name",
    orderBy: { column: "bank_name", ascending: true },
    fields: [
      { name: "bank_name", label: "Bank nomi", type: "text", required: true },
      { name: "account_number", label: "Hisob raqami", type: "text" },
      { name: "mfo", label: "MFO", type: "text" },
      { name: "tin", label: "STIR", type: "text" },
    ],
  },

  "contract-amounts": {
    table: "contract_amounts",
    path: "/contracts/amounts",
    title: "Shartnoma summalari",
    subtitle: "Summalar ro'yxati",
    labelField: "name",
    orderBy: { column: "name", ascending: true },
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "academic_year_id", label: "O'quv yili", type: "select", ref: "academic-years" },
      { name: "class_type_id", label: "Guruh turi", type: "select", ref: "class-types" },
      { name: "amount", label: "Summa", type: "number", required: true },
    ],
  },
} satisfies Record<ReferenceKey, ReferenceConfig>;

export function isReferenceKey(key: string): key is ReferenceKey {
  return Object.prototype.hasOwnProperty.call(REFERENCES, key);
}

export function getReference(key: ReferenceKey): ReferenceConfig {
  return REFERENCES[key];
}
