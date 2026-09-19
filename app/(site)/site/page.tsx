import Link from "next/link";
import { CalendarDays, GraduationCap, Users, Wallet } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ROOT_DOMAIN } from "@/lib/tenant";

const FEATURES = [
  { icon: Users, title: "Qabul va o'quvchilar", text: "Arizadan o'quvchigacha bitta voronkada, ota-onalar bilan birga." },
  { icon: CalendarDays, title: "Dars jadvali va davomat", text: "Fan, o'qituvchi va xona bo'yicha jadval; davomat telefondan." },
  { icon: GraduationCap, title: "Baholar va uy vazifalari", text: "5 ballik jurnal, o'rtacha baho, o'qituvchi kabineti." },
  { icon: Wallet, title: "To'lovlar va maosh", text: "Oylik hisob, qarzdorlar, kassa va xodimlar maoshi." },
];

/** Asosiy sayt (edugram.uz): tanishtiruv va maktabni ro'yxatdan o'tkazish. */
export default function SitePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-canvas to-brand-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Logo className="h-12" />
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/login" className="font-medium text-ink-muted hover:text-ink">
            Maktabga kirish
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Ro&apos;yxatdan o&apos;tish
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-ink md:text-5xl">
          Xususiy maktab uchun yagona boshqaruv tizimi
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-muted">
          Qabuldan hisobotgacha — hammasi bitta joyda. Maktabingiz o&apos;z manziliga ega bo&apos;ladi:{" "}
          <span className="font-medium text-ink">maktabingiz.{ROOT_DOMAIN}</span>
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/register"
            className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            Maktabni ro&apos;yxatdan o&apos;tkazish
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-line bg-surface px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-canvas"
          >
            Maktabga kirish
          </Link>
        </div>
        <p className="mt-3 text-xs text-ink-faint">Sinov muddati bepul</p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <div className="mb-3 inline-flex rounded-lg bg-brand-50 p-2 text-brand-600">
                <Icon size={20} aria-hidden="true" />
              </div>
              <h2 className="text-sm font-semibold text-ink">{f.title}</h2>
              <p className="mt-1 text-sm text-ink-muted">{f.text}</p>
            </div>
          );
        })}
      </section>
    </main>
  );
}
