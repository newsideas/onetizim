/**
 * Ko'p maktabli (multi-tenant) manzillar:
 *   edugram.uz            — asosiy sayt (tanishtiruv, maktabni ro'yxatdan o'tkazish)
 *   admin.edugram.uz      — Super Admin
 *   <slug>.edugram.uz     — bitta maktab (masalan renessans.edugram.uz)
 *
 * Bu fayl proxy (edge) ham, server ham, brauzer ham ishlata oladigan sof
 * funksiyalardan iborat. Asosiy domen NEXT_PUBLIC_ROOT_DOMAIN dan olinadi
 * (mahalliy ishlab chiqishda "localhost" — masalan renessans.localhost:3000).
 */

export const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost").toLowerCase();

export const ADMIN_SUBDOMAIN = "admin";

/** DB dagi slug_is_valid() bilan bir xil qoida (0037). */
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "www", "admin", "app", "api", "mail", "ftp", "static", "cdn", "dev", "test",
  "staging", "demo", "edugram", "support", "help", "status", "blog", "docs",
  "login", "register", "root", "site", "platform", "superadmin",
]);

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value) && !value.includes("--") && !RESERVED_SLUGS.has(value);
}

export type HostInfo =
  | { kind: "root" }
  | { kind: "admin" }
  | { kind: "tenant"; slug: string };

/**
 * Super Admin paneli internetga chiqmaydi: u faqat `ADMIN_PANEL_ENABLED=true` bo'lgan muhitda
 * (sizning kompyuteringiz, `.env.local`) ishlaydi. Vercel'da bu o'zgaruvchi qo'yilmaydi —
 * admin manzili ham, admin server amallari ham yopiq. Faqat serverda o'qiladi (NEXT_PUBLIC_ emas).
 */
export function isAdminPanelEnabled(): boolean {
  return (process.env.ADMIN_PANEL_ENABLED ?? "").trim().toLowerCase() === "true";
}

/**
 * Domen ulanmaguncha (masalan, faqat xxx.vercel.app bor paytda) subdomenlar ishlamaydi.
 * `NEXT_PUBLIC_FORCE_HOST=root` — shu manzil rasmiy sayt bo'lib ochiladi;
 * `NEXT_PUBLIC_FORCE_HOST=admin` — shu manzil Super Admin bo'lib ochiladi;
 * `NEXT_PUBLIC_FORCE_HOST=tenant:<slug>` — shu manzil bitta markaz ilovasi bo'lib ochiladi.
 * O'zgaruvchi bo'sh bo'lsa (asosiy holat) hech narsa o'zgarmaydi. Domen ulangach o'chiriladi.
 */
function forcedHost(): HostInfo | null {
  const value = (process.env.NEXT_PUBLIC_FORCE_HOST ?? "").trim().toLowerCase();
  if (value === "root") return { kind: "root" };
  if (value === "admin") return { kind: "admin" };
  if (value.startsWith("tenant:")) {
    const slug = value.slice("tenant:".length);
    if (isValidSlug(slug)) return { kind: "tenant", slug };
  }
  return null;
}

/**
 * Host sarlavhasidan (port bilan yoki portsiz) manzil turini aniqlaydi.
 * Noma'lum hostlar (127.0.0.1, hosting'ning preview manzillari) asosiy sayt
 * hisoblanadi — hech qachon tasodifan maktab ma'lumotini ochmaydi.
 */
export function resolveHost(hostHeader: string | null | undefined): HostInfo {
  const forced = forcedHost();
  if (forced) return forced;

  const host = (hostHeader ?? "").toLowerCase().split(":")[0];

  if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) return { kind: "root" };

  const suffix = `.${ROOT_DOMAIN}`;
  if (!host.endsWith(suffix)) return { kind: "root" };

  const label = host.slice(0, -suffix.length);
  if (label === ADMIN_SUBDOMAIN) return { kind: "admin" };
  if (label.includes(".") || !isValidSlug(label)) return { kind: "root" };
  return { kind: "tenant", slug: label };
}

interface Loc {
  protocol: string;
  port: string;
}

/** Brauzerdagi joriy protokol/port bilan maktab manzili: https://renessans.edugram.uz/login */
export function tenantUrl(slug: string, path: string, loc: Loc): string {
  const port = loc.port ? `:${loc.port}` : "";
  return `${loc.protocol}//${slug}.${ROOT_DOMAIN}${port}${path}`;
}
