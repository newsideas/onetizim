import { createBrowserClient } from "@supabase/ssr";

/**
 * Brauzer (client component) tomonida ishlatiladigan Supabase client.
 * "use client" komponentlarida chaqiriladi.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
