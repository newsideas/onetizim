import "server-only";

import { createClient } from "@supabase/supabase-js";
import { ActionError } from "@/lib/actions/result";

/**
 * Service role klienti: RLS'ni chetlab o'tadi va foydalanuvchi hisoblarini
 * yaratadi (email tasdiqlashsiz). Faqat serverda, faqat tekshirilgan
 * server action'lar ichida ishlatiladi — kalit hech qachon brauzerga chiqmaydi.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new ActionError(
      "Server sozlanmagan: .env.local ga SUPABASE_SERVICE_ROLE_KEY qo'shing (Supabase → Project Settings → API)",
    );
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
