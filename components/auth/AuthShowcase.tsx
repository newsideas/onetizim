import {
  Wallet,
  CalendarCheck,
  Send,
  BarChart3,
  Users,
  ShieldCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: Wallet,
    title: "Moliya nazorati",
    text: "Tushum, xarajat, qarzdorlik va foyda — bitta oynada",
  },
  {
    icon: CalendarCheck,
    title: "Davomat va jadval",
    text: "Bir bosishda belgilash, xonalar bo'yicha dars jadvali",
  },
  {
    icon: Send,
    title: "Telegram xabarnoma",
    text: "Ota-onaga davomat va qarzdorlik haqida avtomatik xabar",
  },
  {
    icon: BarChart3,
    title: "Hisobotlar",
    text: "Guruh, sinf va davrlar kesimida tahlil",
  },
  {
    icon: Users,
    title: "O'quvchilar bazasi",
    text: "Rasmiy hujjatlar, ota-ona ma'lumoti, shartnomalar",
  },
  {
    icon: ShieldCheck,
    title: "Xavfsiz ma'lumot",
    text: "Har bir muassasa faqat o'z ma'lumotini ko'radi",
  },
];

/**
 * Auth sahifalarining chap tomoni: tizim nima berishini ko'rsatadi.
 * Logo uchun joy qoldirilgan — mijoz o'zi qo'yadi.
 */
export function AuthShowcase() {
  return (
    <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-12 xl:px-20">
      {/* Logo joyi */}
      <div className="mb-8 flex h-14 w-44 items-center rounded-lg border border-dashed border-brand-200 px-3 text-sm text-brand-600">
        Logotip uchun joy
      </div>

      <h2 className="text-2xl font-semibold text-ink">
        Muassasangizni bitta tizimda to&apos;laqonli boshqaring
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-muted">
        Xususiy maktab, bog&apos;cha va o&apos;quv markazlari uchun: o&apos;quvchilar
        bazasi, davomat, to&apos;lovlar, moliya va ota-onalar bilan aloqa —
        barchasi yagona platformada.
      </p>

      <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="rounded-xl border border-line bg-surface p-4 shadow-sm"
            >
              <div className="mb-2 inline-flex rounded-lg bg-brand-50 p-2 text-brand-600">
                <Icon size={18} />
              </div>
              <div className="text-sm font-medium text-ink">{f.title}</div>
              <div className="mt-0.5 text-xs text-ink-muted">{f.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
