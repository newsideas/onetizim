import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isRole, permissionForPath, roleCan } from "@/lib/auth/permissions";
import { resolveHost, type HostInfo } from "@/lib/tenant";

const AUTH_ROUTES = new Set(["/login", "/register"]);

/** Mavjud bo'lmagan yo'l: Next.js 404 sahifasini ko'rsatadi. */
const NOT_FOUND_PATH = "/404-not-found";

type Gate = { action: "allow"; rewrite?: string } | { action: "notfound" };

/**
 * Manzil (host) turiga qarab qaysi yo'llar ochiqligini belgilaydi:
 * - asosiy sayt (edugram.uz): tanishtiruv, ro'yxatdan o'tish, maktab qidirish;
 * - admin.edugram.uz: faqat Super Admin;
 * - <slug>.edugram.uz: faqat maktab ilovasi.
 */
function gateByHost(host: HostInfo, pathname: string): Gate {
  const under = (base: string) => pathname === base || pathname.startsWith(`${base}/`);

  if (host.kind === "root") {
    if (pathname === "/") return { action: "allow", rewrite: "/site" };
    if (pathname === "/login") return { action: "allow", rewrite: "/site/find-school" };
    if (pathname === "/register" || under("/site") || pathname.startsWith("/api/telegram/webhook")) {
      return { action: "allow" };
    }
    return { action: "notfound" };
  }

  if (host.kind === "admin") {
    if (pathname === "/") return { action: "allow", rewrite: "/admin" };
    if (pathname === "/login" || under("/admin")) return { action: "allow" };
    return { action: "notfound" };
  }

  if (under("/admin") || under("/site") || pathname === "/register") return { action: "notfound" };
  return { action: "allow" };
}

function rewriteTo(request: NextRequest, pathname: string, cookiesFrom?: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const response = NextResponse.rewrite(url, { request });
  cookiesFrom?.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

/** Kirmasdan ochiladigan yo'llar. */
function isPublicPath(pathname: string, host: HostInfo) {
  if (host.kind === "admin") return pathname === "/login";
  return (
    AUTH_ROUTES.has(pathname) ||
    pathname.startsWith("/invite/") ||
    pathname.startsWith("/api/telegram/webhook") ||
    pathname.startsWith("/api/cron/")
  );
}

/**
 * Har so'rovda Supabase sessiyasini yangilaydi va tezkor (optimistik)
 * tekshiruv qiladi: kirmagan foydalanuvchi /login'ga, ruxsati yo'q
 * bo'limga kirgan xodim /403'ga yo'naltiriladi.
 *
 * Rol JWT'dagi "org_role" claim'idan olinadi (0022 hook) — bazaga
 * murojaat qilinmaydi. Hook yoqilmagan bo'lsa bu tekshiruv o'tkazib
 * yuboriladi; haqiqiy himoya baribir sahifadagi requirePermission va RLS.
 */
export async function updateSession(request: NextRequest) {
  const host = resolveHost(request.headers.get("host"));
  const gate = gateByHost(host, request.nextUrl.pathname);
  if (gate.action === "notfound") return rewriteTo(request, NOT_FOUND_PATH);
  // Asosiy sayt kirishni talab qilmaydi — maktab sessiyasi faqat o'z subdomenida.
  if (host.kind === "root") {
    return gate.rewrite ? rewriteTo(request, gate.rewrite) : NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const { pathname, search } = request.nextUrl;

  // Yangilangan sessiya cookie'lari yo'naltirishda ham saqlanishi shart,
  // aks holda foydalanuvchi tasodifan tizimdan chiqib ketadi.
  function redirectTo(target: string, next?: string) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.search = "";
    if (next) url.searchParams.set("next", next);
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  }

  if (!claims) {
    if (isPublicPath(pathname, host)) return supabaseResponse;
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
    }
    return redirectTo("/login", pathname === "/" ? undefined : pathname + search);
  }

  if (AUTH_ROUTES.has(pathname)) return redirectTo("/");

  const role = claims.org_role;
  const permission = permissionForPath(pathname);
  if (permission && isRole(role) && !roleCan(role, permission)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
    }
    return redirectTo("/403");
  }

  if (gate.rewrite) return rewriteTo(request, gate.rewrite, supabaseResponse);
  return supabaseResponse;
}
