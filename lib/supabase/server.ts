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
