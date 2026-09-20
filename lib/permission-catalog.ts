import { ALL_PERMISSIONS, type Permission } from "@/lib/auth/permissions";

/**
 * Edu tizimdagi "Rol" oynasining ruxsatlar daraxti: bo'lim → resurs → amallar.
 * Har bir amal saqlanganda `grants` bo'yicha tizimning asosiy ruxsatlariga aylanadi
 * (haqiqiy tekshiruv shu asosiy ruxsatlarda). `grants`siz amallar rol kartasida saqlanadi,
 * lekin tegishli bo'lim tizimda hali bo'lmasa, hech narsani o'zgartirmaydi.
 */
export interface CatalogAction {
  key: string;
  label: string;
  grants: Permission[];
}

export interface CatalogResource {
  key: string;
  label: string;
  actions: CatalogAction[];
}

export interface CatalogSection {
  title: string;
  resources: CatalogResource[];
}

type ActionDef = string | [label: string, ...grants: Permission[]];

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function resource(label: string, actions: ActionDef[] = [], grants: Permission[] = []): CatalogResource {
  const key = slug(label);
  const list = actions.length ? actions : [label];
  return {
    key,
    label,
    actions: list.map((a, i) => {
      const [text, ...g] = Array.isArray(a) ? a : [a];
      return { key: `${key}.${slug(text) || i}`, label: text, grants: g.length ? (g as Permission[]) : i === 0 ? grants : [] };
    }),
  };
}

export const PERMISSION_CATALOG: CatalogSection[] = [
  {
    title: "Bosh sahifa",
    resources: [
      resource("Administrator filiali", ["Administrator filialini ko'rish"]),
      resource("Suhbat", ["Suhbat"]),
      resource("Dashboard", ["Dashboard"], ["dashboard.view"]),
    ],
  },
  {
    title: "Topshiriqlar",
    resources: [
      resource("Xodim topshiriqlari", [
        ["Topshiriqlarni ko'rish", "dashboard.view"],
        "Topshiriqlarni qo'shish",
        "Topshiriqlarni o'zgartirish",
        "Topshiriqlarni yakunlash",
        "Barcha xodim topshiriqlarini ko'rish",
      ]),
      resource("Vazifalar", [
        ["Vazifalarni ko'rish", "dashboard.view"],
        "Vazifa yaratish",
        "Vazifani tahrirlash",
        "Vazifani o'chirish",
        "Qo'yilgan bahoni tahrirlash",
      ]),
    ],
  },
  {
    title: "Lidlar",
    resources: [
      resource("Buyurtma holati", [
        ["Buyurtma holatini ko'rish", "leads.manage"],
        "Buyurtma holatini yaratish",
        "Buyurtma holatini o'zgartirish",
        "Buyurtma holatini o'chirish",
      ]),
      resource("Buyurtma", [
        ["Buyurtmani ko'rish", "leads.manage"],
        ["Buyurtma qo'shish", "leads.manage"],
        ["Buyurtmani tahrirlash", "leads.manage"],
        "Birinchi darsga keladiganlar",
        "Barcha buyurtmalarni ko'rish",
        "Kardni ko'rish",
      ]),
    ],
  },
  {
    title: "Guruh",
    resources: [
      resource("Guruh mashg'uloti", [
        "Guruhga mashg'ulot biriktirish",
        "Guruh mashg'ulotini tahririlash",
        "Guruh mashg'ulotini o'chirish",
      ]),
      resource("Xonalar", [
        ["Xonani ko'rish", "groups.view"],
        ["Xona qo'shish", "groups.manage"],
        ["Xonani tahrirlash", "groups.manage"],
        ["Xonani o'chirish", "groups.manage"],
      ]),
      resource("Jihozlar", [
        ["Jihozlarni ko'rish", "groups.view"],
        ["Jihozlarni tahrirlash", "groups.manage"],
        "Jihozlarni eksport qilish",
        ["Xona jihozlarini tahrirlash", "groups.manage"],
      ]),
      resource("Guruhda o'quvchilarni ko'ra olish", [
        ["O'quvchini guruhga qo'shish", "students.manage"],
        ["O'quvchini guruhdan-guruhga ko'chirish", "students.manage"],
        ["O'quvchini guruhdan chiqarish", "students.manage"],
        ["O'quvchini guruhdan muzlatish", "students.manage"],
        "Qarzdor o'quvchini muzlata olish",
        ["Muzlatilgan o'quvchini muzdan qaytarish", "students.manage"],
        "Bitta dars narxini o'zgartirish",
        "O'quvchi guruhni yakunlashi",
      ]),
      resource("Guruh", [
        ["Guruhni ko'rish", "groups.view"],
        ["Guruh qo'shish", "groups.manage"],
        ["Guruhni tahrirlash", "groups.manage"],
        ["Guruhni o'chirish", "groups.manage"],
        ["Guruh o'quvchilarini ko'rish", "groups.view", "students.view"],
        ["Arivlangan guruhni tahrirlash", "groups.manage"],
        ["Guruhni arxivlash", "groups.manage"],
      ]),
      resource("Guruh davomati", [
        ["Guruh davomatini ko'rish", "attendance.mark"],
        ["Guruh davomatini o'rnatish", "attendance.mark"],
        "Guruh davomatini bekor qilish",
        "Dars vaqtini o'zgartirish",
        "Dars o'qituvchisini o'zgartirish",
        "Dars mundarijasi",
        "Darsni bekor qilish",
        ["O'tgan kunlarni davomat qila olish", "attendance.mark", "attendance.any_date"],
      ]),
      resource("Dars jadvali", [["Dars jadvalini ko'rish", "schedule.view"]]),
    ],
  },
  {
    title: "O'quvchilar",
    resources: [
      resource("O'quvchi", [
        ["O'quvchini ko'rish", "students.view"],
        ["O'quvchini qo'shish", "students.manage"],
        ["O'quvchini tahrirlash", "students.manage"],
        "O'quvchi moderatorini tahririlash",
        ["O'quvchini o'chirish", "students.manage"],
        "Faqat o'zini o'quvchilarini ko'rish",
        "Pro Archive o'quvchilarini oling",
        ["O'quvchilar kirim chiqimini korish", "payments.manage"],
        "O'quvchi tarihini ko'rish",
        ["O'quvchilar tranzaktsiyalarini ko'rish", "payments.manage"],
        ["O'quvchi davomatini ko'rish", "attendance.mark"],
        ["O'quvchi ota-onasini ko'rish", "students.view"],
        ["Arxiv o'quvchilarni ko'rish", "students.view"],
        ["Aktiv o'quvchilarni ko'rish", "students.view"],
        ["Yangi o'quvchilarni ko'rish", "students.view"],
        ["Barcha o'quvchilarni ko'rish", "students.view"],
        "Guruh o'quvchisini lidga qaytarish",
        "O'quvchi uy manzilini o'rnatish",
      ]),
      resource("Bonus", ["O'quvchi bonusini ko'rish", "O'quvchi bonusini tahrirlash", "Hamma bonuslarni ko'rish"]),
      resource("Adminlar KPI", ["Adminlar KPI ini ko'rish", "Adminlar KPI ini o'zgartirish"]),
    ],
  },
  {
    title: "Gamifikatsiya",
    resources: [
      resource("Gamifikatsiya", [
        "Mahsulot yaratish",
        "Mahsulotni tahrirlash",
        "Mahsulotni ko'rish",
        "Mahsulotni o'chirish",
        "Buyurtmani tahrirlash",
        "Buyurtmani ko'rish",
        "Buyurtmani o'chirish",
        "Kategoriya yaratish",
        "Kategoriyani tahrirlash",
        "Kategoriyani ko'rish",
        "Kategoriyani o'chirish",
        "Sababsiz coin qo'shish",
        "Coin qo'shish",
        "Coinni tahrirlash",
        "Coinni o'chirish",
      ]),
    ],
  },
  {
    title: "O'quv bo'limi",
    resources: [
      resource("Mavsumiy baholash", [
        ["Mavsumiy baholashni yaratish", "grades.manage"],
        ["Mavsumiy baholashni tahrirlash", "grades.manage"],
        ["Mavsumiy baholashni ko'rish", "grades.manage"],
        ["Mavsumiy baholashni o'chirish", "grades.manage"],
      ]),
      resource("Daraja", [
        ["Darajani ko'ra olish", "settings.manage"],
        ["Daraja qo'shish", "settings.manage"],
        ["Darajani tahrirlash", "settings.manage"],
        ["Darajani o'chirish", "settings.manage"],
      ]),
      resource("O'quvchi kategoriyasi", [
        ["O'quvchi kategoriyasini ko'ra olish", "settings.manage"],
        ["O'quvchi kategoriyasini qo'shish", "settings.manage"],
        ["O'quvchi kategoriyasini tahrirlash", "settings.manage"],
        ["O'quvchi kategoriyasi o'chirish", "settings.manage"],
      ]),
      resource("Ta'lim yo'nalishi", [
        ["Ta'lim yo'nalishini ko'ra olish", "settings.manage"],
        ["Yo'nalishni qo'shish", "settings.manage"],
        ["Yo'nalishni tahrirlash", "settings.manage"],
        ["Yo'nalishni o'chirish", "settings.manage"],
      ]),
      resource("Kurs", [
        ["Kursni ko'rish", "groups.view"],
        ["Kurs qo'shish", "settings.manage"],
        ["Kursni tahrirlash", "settings.manage"],
        ["Kursni o'chirish", "settings.manage"],
        ["Kursning narxini o'zgartira olishi", "settings.manage"],
      ]),
      resource("Shartnoma", [
        ["Shartnomani ko'rish", "contracts.manage"],
        ["Shartnoma yaratish", "contracts.manage"],
        ["Shartnomani yangilash", "contracts.manage"],
        ["Shartnomani o'chirish", "contracts.manage"],
        ["Ro'yxatdan o'tgan shartnomani yangilash", "contracts.manage"],
        ["Ro'yxatdan o'tgan shartnomani o'chirish", "contracts.manage"],
      ]),
      resource("Onlayn kurs", [
        "Onlayn kurs yaratish",
        "Onlayn kursni tahrirlash",
        "Onlayn kursni o'chirish",
        "Bo'lim yaratish",
        "Bo'limni tahrirlash",
        "Bo'limni o'chirish",
        "Dars yaratish",
        "Darsni tahrirlash",
        "Darsni o'chirish",
        "Kategoriyani ko'rish",
        "Kategoriya yaratish",
        "Kategoriyani tahrirlash",
        "Kategoriyani o'chirish",
        "Topshiriqlarni ko'rish",
        "Aktiv kurslarni ko'rish",
      ]),
      resource("Qabul (daraja testi)", [
        "Test bazasini ko'rish",
        "Test bazasi qo'shish",
        "Test bazasini tahrirlash",
        "Test bazasini o'chirish",
        "Imtihon natijasini ko'rish",
        "Imtihon biriktirish va qaror qabul qilish",
      ]),
    ],
  },
  {
    title: "Moliya",
    resources: [
      resource("Moliya analitikasi", [
        ["Moliya analitikasini ko'rish", "finance.reports"],
        ["Moliya hisobotini ko'rish", "finance.reports"],
      ]),
      resource("O'qituvchi oyligi", [
        ["O'qituvchi oyligini ko'rish", "salaries.manage"],
        ["O'qituvchi oyligini qo'shish", "salaries.manage"],
        ["O'qituvchi oyligini tahrirlash", "salaries.manage"],
        ["O'qituvchi oyligini o'chirish", "salaries.manage"],
      ]),
      resource("Kassa tranzaksiyasi", [
        ["Kassa tranzaksiyalarini ko'rish", "payments.manage"],
        ["Kassa tranzaksiyalarini qo'shish", "payments.manage"],
        ["Kassa tranzaksiyalarini tahrirlash", "payments.manage"],
        ["Kassa tranzaksiyalarini o'chirish", "payments.manage"],
      ]),
      resource("Rejalashtirilgan xarajatlar", [
        ["Rejalashtirilgan xarajatlarni ko'rish", "finance.reports"],
        ["Rejalashtirilgan xarajat yaratish", "finance.reports"],
        ["Rejalashtirilgan xarajatni tahrirlash", "finance.reports"],
        ["Rejalashtirilgan xarajatni o'chirish", "finance.reports"],
      ]),
      resource("Kassa", [
        ["Kassa", "payments.manage"],
        "Kassa kpi",
        ["Kassani tahrirlash", "payments.manage"],
        "Filialni barcha kassalarini ko'rish",
        "O'quv markazini barcha kassalarini ko'rish",
        "Kunlik kassa tarixini ko'rish",
        "Kassani yuklab olish",
        "Bosh kassa qilish",
        "Cashbox investment",
        "Naqd pul qutisi dividendlari",
        "Bonus",
        "Shartnomani ko'rish",
        "Shartnoma yaratish",
        "Ish haqini hisoblovchi qilish",
        "Kassa tranzaksiyasini bekor qilish",
        "Ish haqini amalga oshirish",
      ]),
    ],
  },
  {
    title: "Nazorat",
    resources: [resource("Fikr-mulohaza", ["Fikr-mulohazalarni korish"])],
  },
  {
    title: "Boshqaruv",
    resources: [
      resource("Rol", [
        ["Rolni ko'rish", "roles.manage"],
        ["Rol qo'shish", "roles.manage"],
        ["Rolni tahrirlash", "roles.manage"],
        ["Rolni o'chirish", "roles.manage"],
        ["Xodimga rol biriktirish / tahrirlash", "roles.manage", "staff.accounts"],
      ]),
      resource("Xodimlar", [
        ["Xodimlarni ko'rish", "staff.manage"],
        ["Xodimlarni qo'shish", "staff.manage"],
        ["Xodimlarni tahrirlash", "staff.manage"],
        ["Xodimni ism familyasini tahririlash", "staff.manage"],
        ["Xodimlar arxivi", "staff.manage"],
        ["Xodim oyligini ko'rish", "salaries.manage"],
        ["Xodim oyligini yaratish", "salaries.manage"],
        "Jarimalarni ko'rish",
        "Jarim qo'shish",
        "Oylik foizini ko'rish",
        ["Ish jadvalini ko'rish", "staff.manage"],
        ["Ish jadvalini tahrirlash", "staff.manage"],
      ]),
      resource("Filial", [
        ["Filialni ko'rish", "settings.manage"],
        ["Filialni tahrirlash", "settings.manage"],
        ["Filialni o'chirish", "settings.manage"],
      ]),
    ],
  },
  {
    title: "Sotuv va marketing",
    resources: [
      resource("SMS shablonlari", [
        ["SMSni ko'rish", "notifications.manage"],
        ["SMS qo'shish", "notifications.manage"],
        ["SMSni tahrirlash", "notifications.manage"],
        ["SMSni o'chirish", "notifications.manage"],
        "Shablonsiz SMS yuborish",
      ]),
      resource("Marketing so'rovnomasi", [
        ["Marketing so'rovnomasini ko'rish", "notifications.manage"],
        ["Marketing so'rovnomasini qo'shish", "notifications.manage"],
        ["Marketing so'rovnomasini tahrirlash", "notifications.manage"],
        ["Marketing so'rovnomasini o'chirish", "notifications.manage"],
      ]),
      resource("Yangiliklar", [
        ["Yangiliklarni ko'rish", "notifications.manage"],
        ["Yangilik qo'shish", "notifications.manage"],
        ["Yangilikni tahrirlash", "notifications.manage"],
        ["Yangilikni o'chirish", "notifications.manage"],
      ]),
      resource("Savdo plani", [
        ["Savdo planini ko'rish", "leads.manage"],
        ["Savdo planini sozlash", "leads.manage"],
      ]),
      resource("SMS", [
        ["SMS yuborish", "notifications.manage"],
        ["SMS", "notifications.manage"],
        "SMS larni eksport qilish",
        "cheksiz SMS yuborish",
      ]),
    ],
  },
  {
    title: "Hisobotlar",
    resources: [
      resource("Analitika", [
        ["Moliya analitikasini ko'rish", "finance.reports"],
        ["Buyurtmalar analitikasini ko'rish", "leads.manage"],
        "Buyurtmalar analitikasini eksport qilish",
        ["Barcha analitikalarni ko'rish", "finance.reports"],
        "Edu AI botni ko'rish",
        "Sabablar analitikalari",
        "Statistika",
        "HR.Xonalar analitikasi",
        ["O'qituvchi tahlilini ko'rish", "attendance.mark"],
        ["O'qituvchi davomat analitikasini ko'rish", "attendance.mark"],
        "O'qituvchi davomat analitikasini tahrirlash",
        "O'qituvchi davomat analitikasini eksport qilish",
        ["Filiallar holati va monitoring", "finance.reports"],
        "O'qituvchi oylik to'lov analitikasi",
        "Turniket analitikasi",
        "Support analitikasi",
        "Ish haqi balansi analitikasini ko'rish",
        ["Daromad rejasi analitikasini ko'rish", "finance.reports"],
        ["To'lanmagan analitikasini ko'rish", "finance.reports"],
        ["Farqlar analitikasini ko'rish", "finance.reports"],
        ["Bekor qilingan to'lovlar analitikasini ko'rish", "finance.reports"],
        ["Umumiy chegirmalar analitikasini ko'rish", "finance.reports"],
        ["O'qituvchi samaradorligi analitikasini ko'rish", "attendance.mark"],
        ["Moderator samaradorligi analitikasini ko'rish", "finance.reports"],
        ["Bekor qilingan davomatlar analitikasini ko'rish", "attendance.mark"],
        ["Qatnashmagan guruhlar analitikasini ko'rish", "attendance.mark"],
        ["O'qituvchini reytingini ko'rish", "attendance.mark"],
      ]),
    ],
  },
  {
    title: "Sozlamalar",
    resources: [
      resource("Sozlamalar", [
        "Telegram orqali kunlik hisobotni olish",
        "Lead bot admin",
        ["SMS sozlamalari", "settings.manage"],
        "Avto sms",
        "Menejer Kpi",
        ["Hamkorlarni ko'rish", "settings.manage"],
        ["Hamkorlarni tahrirlash", "settings.manage"],
        "SMS qurilmalarni ko'rish",
        "SMS qurilma qo'shish",
        "SMS qurilmani o'zgartirish",
        "SMS qurilmani o'chirish",
      ]),
      resource("To'lov kvitansiyasi", [
        ["Kvitansiyani ko'rish", "payments.manage"],
        ["Kvitansiyani tahrirlash", "payments.manage"],
      ]),
      resource("Bayram kunlari", [
        ["Bayram kunlarini ko'rish", "settings.manage"],
        ["Bayram kunlarini yaratish", "settings.manage"],
        ["Bayramlar kunlarini tahririlash", "settings.manage"],
        ["Bayram kunlarini o'chirish", "settings.manage"],
      ]),
      resource("Maydon", [
        ["Maydon qo'shish", "settings.manage"],
        ["Maydonni tahrirlash", "settings.manage"],
        ["Maydonni o'chirish", "settings.manage"],
      ]),
    ],
  },
  {
    title: "Importlar",
    resources: [
      resource("Imports", [
        "Kurs shabloni",
        "O'qituvchi shabloni",
        "O'quvchi shabloni",
        "Guruh shabloni",
        "Guruh o'quvchi shabloni",
        "Dars rejasi importi",
        "Dars rejasini tahrirlash",
        "Dars rejasini export qilish",
        "Guruh o'quvchilarini eksport qilish",
      ]),
    ],
  },
  {
    title: "O'qituvchi",
    resources: [
      resource("O'qituvchi", [
        "O'qituvchini guruhga o'quvchi qo'sha olishi",
        "O'qituvchini o'quvchini transfer qila olishi",
        "O'qituvchini guruhdan o'quvchini o'chira olishi",
        "O'qituvchini o'quvchini guruhda muzlatib qo'ya olishi",
        "O'qituvchini muzlatilgan o'quvchini muzdan qaytara olishi",
        "O'qituvchini o'quvchining balansini ko'ra olishi",
        "O'quvchilar uchun kalkulyator",
        "O'qituvchi balansni ko'ra olishi",
        ["O'qituvchi guruhni davomat qilishi", "attendance.mark"],
      ]),
      resource("O'qituvchi topshiriqlari", [
        ["O'qituvchi topshiriq yaratishi", "homework.manage"],
        ["O'qituvchi topshiriqni o'zgartirishi", "homework.manage"],
        ["O'qituvchi topshiriqni o'chirishi", "homework.manage"],
        ["O'qituvchi topshiriqlarni ko'rishi", "homework.manage"],
        "Yordamchi o'qituvchining ishtiroki",
        "Yordamchi o'qituvchi vazifa yaratishi",
        "Yordamchi o'qituvchining vazifani baholashi",
      ]),
    ],
  },
  {
    title: "Blok test",
    resources: [
      resource("Blok test", [
        "Blok testni ko'rish",
        "Blok test turlarini ko'rish",
        "Blok test natijalarini ko'rish",
        "Blok test yaratish",
        "Blok testni tahrirlash",
        "Blok testni o'chirish",
        "Blok test natijasini kiritish",
        "Blok test natijasini eksport qilish",
      ]),
    ],
  },
];

/** Hamma amallar (kalit → amal). */
export const CATALOG_ACTIONS: Map<string, CatalogAction> = new Map(
  PERMISSION_CATALOG.flatMap((s) => s.resources.flatMap((r) => r.actions.map((a) => [a.key, a] as const))),
);

/** Rol saqlanganda "Faqat boss ko'ra oladi" belgisi shu kalit bilan yoziladi. */
export const BOSS_ONLY_KEY = "__boss_only";

/** Tanlangan amallar → tizimning asosiy ruxsatlari (takrorsiz, faqat ma'lum ruxsatlar). */
export function coarseFromActions(keys: Iterable<string>): Permission[] {
  const known = new Set<string>(ALL_PERMISSIONS);
  const out = new Set<Permission>();
  for (const key of keys) {
    for (const p of CATALOG_ACTIONS.get(key)?.grants ?? []) if (known.has(p)) out.add(p);
  }
  return [...out];
}

/**
 * Eski (faqat asosiy ruxsatlar saqlangan) rollar uchun: amal belgilangan hisoblanadi,
 * agar uning barcha `grants`i rolda bor bo'lsa.
 */
export function actionsFromCoarse(coarse: readonly string[]): string[] {
  const have = new Set(coarse);
  return [...CATALOG_ACTIONS.values()]
    .filter((a) => a.grants.length > 0 && a.grants.every((g) => have.has(g)))
    .map((a) => a.key);
}
