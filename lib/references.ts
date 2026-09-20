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

export type FieldType = "text" | "textarea" | "number" | "date" | "time" | "boolean" | "select" | "color";

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
  "course-categories",
  "online-courses",
  "contract-templates",
  "admission-tests",
  "block-test-types",
  "block-tests",
  "transaction-types",
  "planned-expenses",
  "sales-plans",
  "news",
  "stories",
  "sms-templates",
  "marketing",
  "branches",
  "work-schedules",
  "employees",
  "bonuses",
  "fines",
  "feedback",
  "pick-students",
  "pick-groups",
  "assessments",
  "gamification",
  "app-settings",
  "turnstile-events",
  "support-tickets",
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
  /** Sahifadagi chiplar faqat shu guruhdagi ma'lumotnomalarni ko'rsatadi (berilmasa — umumiy). */
  group?: string;
  title: string;
  subtitle: string;
  /** Qatorni boshqa ma'lumotnomalarda ko'rsatish uchun ustun. */
  labelField: string;
  orderBy: { column: string; ascending: boolean };
  fields: RefField[];
  /** Berilsa, "Qo'shish" va tahrirlash yon oyna o'rniga shu yo'ldagi alohida sahifaga olib boradi (`/new`, `/<id>`). */
  formPage?: string;
  /** "Qo'shish" tugmasi yozuvi (masalan "Filial qo'shish"); berilmasa "Qo'shish". */
  addLabel?: string;
  /** Jadvalda ko'rinadigan maydonlar (tartibi bilan); berilmasa — hammasi. Forma baribir hamma maydonni ko'rsatadi. */
  listFields?: string[];
  /** Jadval sarlavhasi maydon yozuvidan farq qilsa (Edu tizimdagidek). */
  listLabels?: Record<string, string>;
  /** Yon panel sarlavhasi ("<nom> qo'shish"); berilmasa ma'lumotnoma nomi ishlatiladi. */
  itemTitle?: string;
  /** Tahrirlash paneli sarlavhasi; berilmasa `<itemTitle>ni tahrirlash`. */
  editTitle?: string;
}

export const REFERENCES = {
  "academic-years": {
    table: "academic_years",
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
    title: "Xonalar",
    subtitle: "Xonalar (auditoriyalar) ro'yxati",
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
    title: "Oflayn kurslar",
    subtitle: "Kurslar (fanlar) ro'yxati",
    formPage: "/education/courses",
    addLabel: "Kurs qo'shish",
    listFields: ["name", "color"],
    listLabels: { color: "Rang" },
    labelField: "name",
    orderBy: { column: "name", ascending: true },
    fields: [
      { name: "name", label: "Sarlavha", type: "text", required: true },
      { name: "code", label: "Kodi", type: "text" },
      { name: "color", label: "Rang (masalan #3D68FF)", type: "text" },
      { name: "category_id", label: "Kategoriya", type: "select", ref: "course-categories" },
    ],
  },

  "lesson-times": {
    table: "lesson_times",
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
    title: "Sinf narxlari",
    subtitle: "O'quv yili va sinf turi bo'yicha narxlar (fanlarga narx qo'yilmaydi)",
    labelField: "name",
    orderBy: { column: "name", ascending: true },
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "academic_year_id", label: "O'quv yili", type: "select", ref: "academic-years" },
      { name: "class_type_id", label: "Sinf turi", type: "select", ref: "class-types" },
      { name: "amount", label: "Summa", type: "number", required: true },
    ],
  },

  // ---- Edu tizim bo'limlari (0045_edu_lists.sql) ----

  "course-categories": {
    table: "course_categories",
    group: "education",
    title: "Kategoriya",
    subtitle: "Kurs kategoriyalari",
    labelField: "name",
    orderBy: { column: "name", ascending: true },
    fields: [{ name: "name", label: "Kategoriya", type: "text", required: true }],
  },

  "online-courses": {
    table: "online_courses",
    group: "education",
    title: "Onlayn kurs",
    subtitle: "Onlayn kurslar ro'yxati",
    addLabel: "Kurs qo'shish",
    labelField: "name",
    orderBy: { column: "name", ascending: true },
    fields: [
      { name: "name", label: "Kurs nomi", type: "text", required: true },
      { name: "description", label: "Tavsif", type: "textarea" },
      { name: "is_active", label: "Faol", type: "boolean" },
    ],
  },

  "contract-templates": {
    table: "contract_templates",
    group: "education",
    title: "Shartnoma shablonlari",
    subtitle: "Shartnoma shablonlari ro'yxati",
    labelField: "title",
    orderBy: { column: "created_at", ascending: false },
    formPage: "/education/contract-templates",
    addLabel: "Shartnoma yaratish",
    listFields: ["number", "title", "type_id", "created_at"],
    listLabels: { created_at: "Yaratilgan sana" },
    fields: [
      { name: "number", label: "Shartnoma raqami", type: "text" },
      { name: "title", label: "Sarlavha", type: "text", required: true },
      { name: "type_id", label: "Shartnoma turi", type: "select", ref: "contract-types" },
      { name: "body", label: "Matni", type: "textarea" },
    ],
  },

  "admission-tests": {
    table: "admission_tests",
    group: "education",
    title: "Qabul test bazasi",
    subtitle: "Kurslar bo'yicha qabul testlari",
    addLabel: "Baza yaratish",
    listFields: ["course_id", "questions_total", "questions_per_test", "minutes", "score_per_question", "status"],
    listLabels: {
      questions_total: "Bazadagi savollar",
      questions_per_test: "Savol / test",
      minutes: "Vaqt",
      score_per_question: "Ball / savol",
      status: "Holat",
    },
    labelField: "id",
    orderBy: { column: "created_at", ascending: false },
    fields: [
      { name: "course_id", label: "Kurs", type: "select", ref: "subjects", required: true },
      { name: "questions_per_test", label: "Bir testga tushadigan savollar soni", type: "number" },
      { name: "minutes", label: "Test vaqti (daqiqa)", type: "number" },
      { name: "score_per_question", label: "Har to'g'ri javob balli", type: "number" },
    ],
  },

  "block-test-types": {
    table: "block_test_types",
    group: "block-test",
    title: "Blok test turlari",
    subtitle: "Blok test turlari ro'yxati",
    addLabel: "Tur qo'shish",
    listFields: ["name", "code", "minutes", "courses", "is_active", "created_at"],
    listLabels: { code: "Kodi", courses: "Kurslar", is_active: "Holati", created_at: "Qo'shilgan sana" },
    labelField: "name",
    orderBy: { column: "name", ascending: true },
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "code", label: "Turi (kodi)", type: "text" },
      { name: "minutes", label: "Davomiyligi (daqiqa)", type: "number" },
      { name: "questions_count", label: "Savollar soni", type: "number" },
      { name: "score_per_answer", label: "Har bir to'g'ri javob uchun ball", type: "number" },
      { name: "is_active", label: "Faol", type: "boolean" },
    ],
  },

  "block-tests": {
    table: "block_tests",
    group: "block-test",
    title: "Blok testlar",
    subtitle: "Blok testlar ro'yxati",
    addLabel: "Blok test qo'shish",
    listFields: ["name", "type_id", "status", "test_date", "start_time", "minutes", "responsible_id", "group_id"],
    listLabels: { type_id: "Turi", status: "Holati", minutes: "Davomiyligi (daqiqa)" },
    labelField: "name",
    orderBy: { column: "test_date", ascending: false },
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "type_id", label: "Tur", type: "select", ref: "block-test-types" },
      { name: "test_date", label: "Sana", type: "date" },
      { name: "start_time", label: "Boshlanish vaqti", type: "time" },
      { name: "minutes", label: "Davomiyligi (daqiqa)", type: "number" },
      { name: "group_id", label: "Guruhlar", type: "select", ref: "pick-groups" },
      { name: "responsible_id", label: "Mas'ul xodim", type: "select", ref: "employees" },
      { name: "note", label: "Izoh", type: "text" },
    ],
  },

  "transaction-types": {
    table: "transaction_types",
    group: "finance",
    title: "Tranzaksiya turi",
    subtitle: "Kirim va chiqim tranzaksiya turlari",
    labelField: "name",
    orderBy: { column: "name", ascending: true },
    itemTitle: "Tranzaksiya turini",
    editTitle: "Tranzaksiya turini tahrirlash",
    // Edu tizimdagidek: rang, yuqori tranzaksiya, miqdor chegarasi, mijoz va kategoriya.
    fields: [
      { name: "name", label: "Ism", type: "text", required: true },
      { name: "color", label: "Rang", type: "color" },
      { name: "parent_id", label: "Yuqori tranzaksiya", type: "select", ref: "transaction-types" },
      { name: "min_amount", label: "Minimal miqdor", type: "number" },
      { name: "max_amount", label: "Maksimal miqdor", type: "number" },
      {
        name: "client_type",
        label: "Mijoz",
        type: "select",
        options: ["Boshqa", "O'quvchilar", "Xodim", "Uchinchi shaxs"],
      },
      { name: "kind", label: "Kategoriyasi", type: "select", options: ["Kirim", "Chiqim"], required: true },
      // Pul oqimi hisoboti (0068) shu bo'yicha chiqimlarni guruhlaydi; bo'sh bo'lsa "Operatsion".
      { name: "activity", label: "Faoliyat turi", type: "select", options: ["Operatsion", "Investitsion", "Moliyaviy"] },
    ],
  },

  "planned-expenses": {
    table: "planned_expenses",
    group: "finance",
    title: "Rejalashtirilgan xarajatlar",
    subtitle: "Kelgusi xarajatlar rejasi",
    labelField: "name",
    orderBy: { column: "created_at", ascending: false },
    itemTitle: "Xarajat",
    listFields: ["name", "amount", "kind", "start_date", "end_date", "status"],
    // Edu tizimdagidek: takrorlanuvchi reja (kunlik/oylik), holati va davri.
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "amount", label: "Miqdori", type: "number", required: true },
      { name: "kind", label: "Turi", type: "select", options: ["Kunlik", "Oylik"] },
      { name: "status", label: "Holati", type: "select", options: ["Aktiv", "Nofaol"] },
      { name: "start_date", label: "Boshlanish sanasi", type: "date" },
      { name: "end_date", label: "Tugash sanasi", type: "date" },
    ],
  },

  "sales-plans": {
    table: "sales_plans",
    group: "marketing",
    title: "Savdo plani",
    subtitle: "Oylik savdo rejalari",
    addLabel: "Planni sozlash",
    labelField: "plan_month",
    orderBy: { column: "plan_month", ascending: false },
    fields: [
      { name: "plan_month", label: "Oy (1-sana)", type: "date", required: true },
      { name: "target_leads", label: "Buyurtmalar rejasi", type: "number" },
      { name: "target_students", label: "Yangi o'quvchilar rejasi", type: "number" },
      { name: "target_revenue", label: "Tushum rejasi", type: "number" },
      { name: "note", label: "Izoh", type: "text" },
    ],
  },

  news: {
    table: "news_posts",
    group: "marketing",
    title: "Yangiliklar",
    subtitle: "Markaz yangiliklari",
    addLabel: "Yangilik qo'shish",
    listFields: ["image", "title", "body", "views", "created_at"],
    listLabels: { image: "Rasm", body: "Kontent", views: "Ko'rilganlar", created_at: "Sana" },
    labelField: "title",
    orderBy: { column: "created_at", ascending: false },
    fields: [
      { name: "title", label: "Sarlavha", type: "text", required: true },
      { name: "body", label: "Matni", type: "textarea" },
      { name: "for_students", label: "O'quvchilar uchun", type: "boolean" },
      { name: "for_parents", label: "Ota-onalar uchun", type: "boolean" },
      { name: "for_employees", label: "Xodimlar uchun", type: "boolean" },
    ],
  },

  stories: {
    table: "stories",
    group: "marketing",
    title: "Hikoya",
    subtitle: "Ilovadagi hikoyalar (stories)",
    addLabel: "Hikoya qo'shish",
    listFields: ["image_url", "title", "created_at", "file"],
    listLabels: { image_url: "Rasm", created_at: "Sana", file: "Fayl" },
    labelField: "title",
    orderBy: { column: "created_at", ascending: false },
    fields: [
      { name: "title", label: "Sarlavha", type: "text", required: true },
      { name: "image_url", label: "Rasm havolasi", type: "text" },
      { name: "link_url", label: "Havola", type: "text" },
      { name: "expires_on", label: "Amal qilish muddati", type: "date" },
    ],
  },

  "sms-templates": {
    table: "sms_templates",
    group: "marketing",
    title: "SMS shablonlari",
    subtitle: "SMS xabar shablonlari",
    labelField: "title",
    orderBy: { column: "created_at", ascending: false },
    itemTitle: "SMS shablon",
    addLabel: "SMS shablon qo'shish",
    listFields: ["title", "kind", "body"],
    listLabels: { body: "SMS" },
    fields: [
      {
        name: "kind",
        label: "Turi",
        type: "select",
        required: true,
        options: ["To'lov eslatmasi", "Qarzdorlik", "Davomat", "Tug'ilgan kun", "Umumiy"],
      },
      { name: "title", label: "Sarlavha", type: "text" },
      { name: "body", label: "Sms", type: "textarea" },
    ],
  },

  marketing: {
    table: "marketing_campaigns",
    group: "marketing",
    title: "Marketing",
    subtitle: "Marketing so'rovnomalari",
    addLabel: "So'rovnoma qo'shish",
    listFields: ["name", "image", "web_link", "bot_link", "tilda_link"],
    listLabels: { image: "Rasm", web_link: "Veb havolasi", bot_link: "Bot havolasi", tilda_link: "Tilda havolasi" },
    labelField: "name",
    orderBy: { column: "created_at", ascending: false },
    itemTitle: "So'rovnoma",
    editTitle: "So'rovnomani tahrirlash",
    // Edu tizimdagidek: sarlavha, subtitr, miqdor, til, ko'rsatish va filial.
    fields: [
      { name: "name", label: "Sarlavha", type: "text", required: true },
      { name: "subtitle", label: "Subtitr", type: "text" },
      { name: "amount", label: "Miqdori", type: "number" },
      { name: "language", label: "So'rovnoma tili", type: "select", options: ["O'zbekcha", "Ruscha", "Inglizcha"] },
      { name: "is_shown", label: "Ko'rsatish", type: "boolean" },
      { name: "branch_id", label: "Filial", type: "select", ref: "branches" },
    ],
  },

  branches: {
    table: "branches",
    group: "management",
    title: "Filiallar",
    subtitle: "Markaz filiallari",
    labelField: "name",
    orderBy: { column: "name", ascending: true },
    // Xaritali alohida sahifa (Edu tizimdagidek).
    formPage: "/settings/branches",
    addLabel: "Filial qo'shish",
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "address", label: "Manzil", type: "text" },
      { name: "radius", label: "Radius", type: "number", required: true },
      { name: "lat", label: "Manzil (Lat)", type: "number" },
      { name: "lng", label: "Manzil (Lng)", type: "number" },
      { name: "max_groups", label: "Filialni maksimal guruhlar sig'imi", type: "number" },
      { name: "max_students", label: "Filialni maksimal o'quvchilar sig'imi", type: "number" },
      { name: "ielts_link", label: "IELTS registratsiya linki", type: "text" },
    ],
  },

  "work-schedules": {
    table: "work_schedules",
    group: "management",
    title: "Ish jadvali",
    subtitle: "Xodimlarning ish vaqti jadvallari",
    labelField: "name",
    orderBy: { column: "name", ascending: true },
    // Yillik kalendar alohida sahifada (Edu tizimdagidek); bu yerda faqat ro'yxat ustunlari.
    formPage: "/settings/work-schedules",
    fields: [
      { name: "name", label: "Nomi", type: "text", required: true },
      { name: "year", label: "Yil", type: "number" },
      { name: "code", label: "Kod", type: "text" },
    ],
  },

  // ---- Bonus, jarima, fikr-mulohaza (0046_staff_money_feedback.sql) ----

  // Xodimlar: boshqa ma'lumotnomalarda tanlash uchun (teachers jadvali). Menyuda ko'rinmaydi.
  employees: {
    table: "teachers",
    group: "hidden",
    title: "Xodimlar",
    subtitle: "Xodimlar ro'yxati",
    labelField: "full_name",
    orderBy: { column: "full_name", ascending: true },
    fields: [
      { name: "full_name", label: "F.I.Sh.", type: "text", required: true },
      { name: "phone", label: "Telefon", type: "text" },
      { name: "position", label: "Lavozimi", type: "text" },
    ],
  },

  bonuses: {
    table: "staff_bonuses",
    group: "finance",
    title: "Bonus",
    subtitle: "Xodimlarga berilgan bonuslar",
    addLabel: "Bonus yaratish",
    listFields: ["transaction_type_id", "employee_id", "given_by", "amount_before", "amount", "amount_after", "reason", "cause"],
    listLabels: {
      transaction_type_id: "Bonus turi",
      employee_id: "To'liq ismi",
      given_by: "Kim tomonidan",
      amount_before: "Oldingi miqdor",
      amount: "Miqdor",
      amount_after: "Keyingi miqdor",
      reason: "Izoh",
      cause: "Sababi",
    },
    labelField: "id",
    orderBy: { column: "given_on", ascending: false },
    // Edu tizimdagidek: tranzaksiya turi, qiymat, izoh. Sana (given_on) bazada avtomatik bugungi kun bo'ladi.
    fields: [
      { name: "employee_id", label: "Xodim", type: "select", ref: "employees", required: true },
      { name: "transaction_type_id", label: "Tranzaksiya turi", type: "select", ref: "transaction-types" },
      { name: "amount", label: "Qiymat", type: "number", required: true },
      { name: "reason", label: "Izoh", type: "text" },
    ],
  },

  fines: {
    table: "staff_fines",
    group: "finance",
    title: "Jarima",
    subtitle: "Xodimlarga qo'yilgan jarimalar",
    addLabel: "Jarima qo'shish",
    listFields: ["employee_id", "amount_before", "amount", "amount_after", "reason", "cause", "transaction_type_id", "status"],
    listLabels: {
      employee_id: "To'liq ismi",
      amount_before: "Oldingi miqdor",
      amount: "Miqdori",
      amount_after: "Keyingi miqdor",
      reason: "Izoh",
      cause: "Sababi",
      transaction_type_id: "Tranzaksiya turi",
      status: "Holati",
    },
    labelField: "id",
    orderBy: { column: "given_on", ascending: false },
    // Edu tizimdagidek: tranzaksiya turi, qiymat, izoh. Sana (given_on) bazada avtomatik bugungi kun bo'ladi.
    fields: [
      { name: "employee_id", label: "Xodim", type: "select", ref: "employees", required: true },
      { name: "transaction_type_id", label: "Tranzaksiya turi", type: "select", ref: "transaction-types" },
      { name: "amount", label: "Qiymat", type: "number", required: true },
      { name: "reason", label: "Izoh", type: "text" },
    ],
  },

  feedback: {
    table: "feedback",
    group: "control",
    title: "Fikr-mulohaza",
    subtitle: "O'quvchi va ota-onalarning fikrlari",
    listFields: ["branch", "from_kind", "author_name", "phone", "kind", "comment", "created_at"],
    listLabels: {
      branch: "Filial",
      from_kind: "Kimdan",
      author_name: "Ism",
      phone: "Telefon raqam",
      kind: "Turi",
      comment: "Izoh",
      created_at: "Yaratilgan sanasi",
    },
    labelField: "author_name",
    orderBy: { column: "given_on", ascending: false },
    fields: [
      { name: "author_name", label: "Kim tomonidan", type: "text", required: true },
      { name: "about_employee_id", label: "Xodim haqida", type: "select", ref: "employees" },
      { name: "rating", label: "Baho", type: "select", options: ["1", "2", "3", "4", "5"] },
      { name: "comment", label: "Fikr", type: "textarea" },
      { name: "given_on", label: "Sana", type: "date", required: true },
    ],
  },

  // ---- Mavsumiy baholash (0047_assessments.sql) ----

  // Faqat boshqa ma'lumotnomalarda tanlash uchun; alohida sahifasi yo'q (group: "hidden").
  "pick-students": {
    table: "students",
    group: "hidden",
    title: "O'quvchilar",
    subtitle: "O'quvchilar",
    labelField: "full_name",
    orderBy: { column: "full_name", ascending: true },
    fields: [{ name: "full_name", label: "F.I.Sh.", type: "text", required: true }],
  },

  "pick-groups": {
    table: "groups",
    group: "hidden",
    title: "Guruhlar",
    subtitle: "Guruhlar",
    labelField: "name",
    orderBy: { column: "name", ascending: true },
    fields: [{ name: "name", label: "Nomi", type: "text", required: true }],
  },

  assessments: {
    table: "assessments",
    group: "education",
    title: "Mavsumiy baholash",
    subtitle: "O'quvchilarning mavsumiy baholari",
    listFields: ["student_id", "course", "group_id", "assessed_on", "score", "note"],
    listLabels: { course: "Kurs" },
    labelField: "id",
    orderBy: { column: "assessed_on", ascending: false },
    fields: [
      { name: "student_id", label: "O'quvchi", type: "select", ref: "pick-students", required: true },
      { name: "group_id", label: "Guruh", type: "select", ref: "pick-groups" },
      { name: "assessed_on", label: "Sana", type: "date", required: true },
      { name: "score", label: "Ball", type: "number", required: true },
      { name: "note", label: "Izoh", type: "text" },
    ],
  },

  // ---- Gamifikatsiya va ilova sozlamalari (0048_gamification_app_settings.sql) ----

  gamification: {
    table: "gamification_rules",
    group: "settings",
    title: "Gamifikatsiya",
    subtitle: "O'quvchilarga ball berish qoidalari",
    labelField: "name",
    orderBy: { column: "created_at", ascending: false },
    fields: [
      { name: "name", label: "Qoida nomi", type: "text", required: true },
      { name: "points", label: "Ball", type: "number", required: true },
      { name: "description", label: "Tavsif", type: "textarea" },
      { name: "is_active", label: "Faol", type: "boolean" },
    ],
  },

  "app-settings": {
    table: "app_settings",
    group: "settings",
    title: "Ilova sozlamalari",
    subtitle: "Mobil ilova va portal sozlamalari (kalit — qiymat)",
    labelField: "setting_key",
    orderBy: { column: "setting_key", ascending: true },
    fields: [
      { name: "setting_key", label: "Kalit", type: "text", required: true },
      { name: "setting_value", label: "Qiymat", type: "text" },
      { name: "note", label: "Izoh", type: "text" },
    ],
  },

  // ---- Turniket va support (0051_turnstile_support.sql) ----

  "turnstile-events": {
    table: "turnstile_events",
    group: "control",
    title: "Turniket voqealari",
    subtitle: "Turniketdan o'tishlar (qurilmadan yoki qo'lda kiritiladi)",
    labelField: "id",
    orderBy: { column: "event_date", ascending: false },
    fields: [
      { name: "student_id", label: "O'quvchi", type: "select", ref: "pick-students", required: true },
      { name: "direction", label: "Yo'nalish", type: "select", options: ["Kirish", "Chiqish"], required: true },
      { name: "event_date", label: "Sana", type: "date", required: true },
      { name: "event_time", label: "Vaqt", type: "time", required: true },
      { name: "device", label: "Qurilma", type: "text" },
    ],
  },

  "support-tickets": {
    table: "support_tickets",
    group: "control",
    title: "Support murojaatlari",
    subtitle: "O'quvchi va ota-onalarning murojaatlari",
    labelField: "subject",
    orderBy: { column: "created_on", ascending: false },
    fields: [
      { name: "author_name", label: "Murojaat egasi", type: "text", required: true },
      { name: "subject", label: "Mavzu", type: "text", required: true },
      { name: "description", label: "Tavsif", type: "textarea" },
      { name: "status", label: "Holati", type: "select", options: ["Yangi", "Jarayonda", "Yopilgan"], required: true },
      { name: "created_on", label: "Kelgan sana", type: "date", required: true },
      { name: "closed_on", label: "Yopilgan sana", type: "date" },
    ],
  },
} satisfies Record<ReferenceKey, ReferenceConfig>;

export function isReferenceKey(key: string): key is ReferenceKey {
  return Object.prototype.hasOwnProperty.call(REFERENCES, key);
}

export function getReference(key: ReferenceKey): ReferenceConfig {
  return REFERENCES[key];
}

export function referencePath(key: ReferenceKey): string {
  return `/settings/references/${key}`;
}
