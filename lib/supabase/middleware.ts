import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isRole, permissionForPath, roleCan } from "@/lib/auth/permissions";

const AUTH_ROUTES = new Set(["/login", "/register"]);

/** Kirmasdan ochiladigan yo'llar. */
function isPublicPath(pathname: string) {
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
    if (isPublicPath(pathname)) return supabaseResponse;
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

  return supabaseResponse;
}
