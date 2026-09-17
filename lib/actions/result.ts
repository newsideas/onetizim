import { unstable_rethrow } from "next/navigation";

/**
 * Server action natijasi. Kutilgan xatolar (validatsiya, dublikat, ruxsat)
 * qiymat sifatida qaytariladi: Next.js production'da tashlangan xato
 * matnini brauzerga yubormaydi, foydalanuvchi faqat umumiy xabar ko'rardi.
 */
export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

/** Foydalanuvchiga ko'rsatiladigan xato — matni o'zgarishsiz qaytariladi. */
export class ActionError extends Error {}

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ActionError) return { ok: false, error: error.message };
    console.error(error);
    return { ok: false, error: "Kutilmagan xatolik yuz berdi. Qaytadan urinib ko'ring." };
  }
}

/** Client komponentlar uchun: xato bo'lsa oddiy Error tashlaydi. */
export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
