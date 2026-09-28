import Link from "next/link";
import { headers } from "next/headers";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/server";
import { ROOT_DOMAIN, resolveHost } from "@/lib/tenant";

/**
 * Qaytish manzili: haqiqiy markaz ichida — markazning bosh sahifasi; noma'lum markaz manzilida — rasmiy sayt
 * (aks holda tugma yana shu mavjud bo'lmagan manzilga olib borib, 404 halqa bo'lardi).
 */
async function homeHref(): Promise<string> {
  const hostHeader = (await headers()).get("host") ?? "";
  const host = resolveHost(hostHeader);
  if (host.kind !== "tenant") return "/";

  const supabase = await createClient();
  const { data } = await supabase.rpc("org_public_by_slug", { p_slug: host.slug });
  if (Array.isArray(data) ? data.length > 0 : Boolean(data)) return "/";

  const port = hostHeader.includes(":") ? `:${hostHeader.split(":")[1]}` : "";
  return `//${ROOT_DOMAIN}${port}/`;
}

/** Mavjud bo'lmagan sahifa va noma'lum markaz manzili uchun (Next.js inglizcha standart sahifasi o'rniga). */
export default async function NotFound() {
  const href = await homeHref();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas px-4 text-center">
      <Logo className="h-8" />
      <div className="space-y-2">
        <p className="text-5xl font-bold text-brand-600">404</p>
        <h1 className="text-xl font-semibold text-ink">Sahifa topilmadi</h1>
        <p className="max-w-md text-sm text-ink-muted">
          Manzil noto&apos;g&apos;ri yozilgan yoki bu sahifa mavjud emas. Markaz manzilini tekshiring (masalan,
          markaz-nomi.onetizim.uz).
        </p>
      </div>
      <Link
        href={href}
        className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        Bosh sahifaga qaytish
      </Link>
    </main>
  );
}
