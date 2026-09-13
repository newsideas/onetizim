import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server component / server action / route handler tomonida ishlatiladigan
 * Supabase client. Next.js 16'da cookies() async bo'lgani uchun bu funksiya
 * ham async.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Next.js so'rovlarni o'z keshiga oladi va natijada ma'lumot
      // o'zgargandan keyin ham sahifa eski holatni ko'rsatib qolardi
      // (masalan yangi qo'shilgan xona ro'yxatda chiqmasdi). CRM'da
      // ma'lumot har doim joriy bo'lishi kerak — shuning uchun keshsiz.
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: "no-store" }),
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server component ichida chaqirilsa (middleware/proxy sessiyani
            // yangilagani uchun) bu xatoni e'tiborsiz qoldirish mumkin.
          }
        },
      },
    },
  );
}
