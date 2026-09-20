import type { Metadata } from "next";
import {
  BarChart3,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  MessageCircle,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { DemoRequestForm } from "@/components/site/DemoRequestForm";

/** Yorug' mavzu qiymatlari (globals.css dagi tokenlar bilan bir xil). */
const LIGHT_TOKENS = {
  colorScheme: "light",
  "--color-canvas": "#f0f2f2",
  "--color-surface": "#ffffff",
  "--color-line": "#dbe0e6",
  "--color-ink": "#212529",
  "--color-ink-muted": "#64748b",
  "--color-ink-faint": "#94a3b8",
} as React.CSSProperties;

export const metadata: Metadata = {
  title: "onetizim — o'quv markazlar uchun boshqaruv tizimi",
  description:
    "O'quv markazingizni bitta tizimda boshqaring: qabul, o'quvchilar, guruhlar, davomat, to'lovlar, oyliklar va hisobotlar. 7 kun bepul sinov.",
};

const FEATURES = [
  { icon: ClipboardList, title: "Qabul va lidlar", text: "Har bir murojaat voronkada: qo'ng'iroqdan sinov darsigacha va o'quvchiga aylanguncha." },
  { icon: Users, title: "O'quvchilar va guruhlar", text: "O'quvchi kartalari, guruhlar, kurslar, o'qituvchilar va xonalar — bir joyda." },
  { icon: CalendarCheck, title: "Dars jadvali va davomat", text: "Jadval guruhdagi kun va vaqtdan o'zi tuziladi, davomat telefondan belgilanadi." },
  { icon: Wallet, title: "To'lovlar va kassa", text: "Oylik hisob, qarzdorlar, bir nechta kassa, chiqim va o'tkazmalar." },
  { icon: GraduationCap, title: "Oylik va xodimlar", text: "Xodimlar, ish jadvali, bonus va jarima, oylik hisoblash va to'lash." },
  { icon: MessageCircle, title: "Ota-onalar uchun aloqa", text: "Telegram orqali xabarnomalar, uy vazifalari va o'quvchi natijalari." },
  { icon: BarChart3, title: "Hisobot va tahlil", text: "Tushum, qarzdorlik, sotuv voronkasi, davomat va o'qituvchilar samaradorligi." },
  { icon: ShieldCheck, title: "Rollar va xavfsizlik", text: "Har xodim o'z rolida ishlaydi. Har markazning ma'lumoti alohida va yopiq." },
];

const STEPS = [
  { n: "1", title: "Ariza qoldirasiz", text: "Markaz nomi va telefon raqamingizni yozasiz." },
  { n: "2", title: "Biz bog'lanamiz", text: "Markazingiz haqida ma'lumot olib, tizimni siz uchun sozlaymiz." },
  { n: "3", title: "Kirasiz va ishlaysiz", text: "O'zingizning manzilingiz (markaz-nomi.onetizim.uz), login va parol beramiz." },
];

function contactLink(): { href: string; label: string } | null {
  const telegram = process.env.NEXT_PUBLIC_CONTACT_TELEGRAM?.trim();
  if (telegram) return { href: telegram, label: "Telegramda yozish" };
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim();
  if (phone) return { href: `tel:${phone.replace(/\s/g, "")}`, label: phone };
  return null;
}

/** Rasmiy sayt (onetizim.uz): xizmat haqida va demo uchun ariza. */
export default function SitePage() {
  const contact = contactLink();

  return (
    // Rasmiy sayt har doim yorug': tokenlar o'ramada qotirilgan, shuning uchun qorong'i tizimda ham miltillamaydi.
    <div className="min-h-screen bg-white text-ink" style={LIGHT_TOKENS}>

      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo className="h-7" />
          <nav aria-label="Sayt menyusi" className="flex items-center gap-2 text-sm sm:gap-5">
            <a href="#imkoniyatlar" className="hidden text-ink-muted hover:text-ink sm:inline">
              Imkoniyatlar
            </a>
            <a href="#qanday" className="hidden text-ink-muted hover:text-ink sm:inline">
              Qanday ishlaydi
            </a>
            <a
              href="#demo"
              className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white transition-colors hover:bg-brand-700"
            >
              Demo so&apos;rash
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="bg-[linear-gradient(80deg,rgba(48,46,145,0.10)_0%,rgba(57,118,174,0.10)_100%)]">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-24">
            <p className="mb-4 inline-block rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 shadow-sm">
              O&apos;quv markazlar uchun · 7 kun bepul sinov
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-5xl">
              O&apos;quv markazingizni bitta tizimda boshqaring
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-ink-muted sm:text-lg">
              Qabuldan hisobotgacha — hammasi bitta joyda: o&apos;quvchilar, guruhlar, davomat, to&apos;lovlar va
              oyliklar. Markazingiz o&apos;z manzili, o&apos;z login va parolini oladi.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="#demo"
                className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700"
              >
                Demo uchun ariza qoldirish
              </a>
              <a
                href="#imkoniyatlar"
                className="rounded-lg border border-line bg-white px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-canvas"
              >
                Imkoniyatlarni ko&apos;rish
              </a>
            </div>
          </div>
        </section>

        <section id="imkoniyatlar" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-ink sm:text-3xl">Markazingiz uchun kerakli hamma narsa</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-ink-muted">
            Kundalik ishni yengillashtiradigan asosiy bo&apos;limlar.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="qanday" className="scroll-mt-16 bg-canvas">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <h2 className="text-center text-2xl font-bold text-ink sm:text-3xl">Qanday boshlanadi</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="text-center">
                  <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-lg font-semibold text-white">
                    {s.n}
                  </span>
                  <h3 className="text-base font-semibold text-ink">{s.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="demo" className="mx-auto max-w-xl scroll-mt-16 px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-ink sm:text-3xl">Demo uchun ariza</h2>
          <p className="mb-8 mt-2 text-center text-sm text-ink-muted">
            Ma&apos;lumotlaringizni qoldiring, biz siz bilan bog&apos;lanamiz.
          </p>
          <DemoRequestForm />
          {contact && (
            <p className="mt-6 text-center text-sm text-ink-muted">
              Yoki to&apos;g&apos;ridan-to&apos;g&apos;ri bog&apos;laning:{" "}
              <a href={contact.href} className="font-medium text-brand-600 hover:underline">
                {contact.label}
              </a>
            </p>
          )}
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-ink-faint">
          <Logo className="h-5" />
          <span>© {new Date().getFullYear()} onetizim. Barcha huquqlar himoyalangan.</span>
        </div>
      </footer>
    </div>
  );
}
