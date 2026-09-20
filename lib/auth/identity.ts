/**
 * Telefon/login asosidagi kirish.
 *
 * Supabase Auth email talab qiladi, shuning uchun foydalanuvchi ko'rmaydigan
 * ichki email yasaladi: <telefon-yoki-login>__<maktab-slug>@login.edugram.uz.
 * Bu manzilga hech qachon xat yuborilmaydi (hisob email tasdiqlashsiz
 * yaratiladi). Har maktabning hisoblari alohida: bir xil telefon ikki
 * maktabda turli hisob bo'la oladi.
 *
 * Eski hisoblar (haqiqiy email bilan ro'yxatdan o'tganlar) ham ishlaydi:
 * "@" bor kiritma o'zgartirilmasdan email sifatida ishlatiladi.
 */

export const IDENTITY_DOMAIN = "login.edugram.uz";

/** Login: kamida bitta harf; harf, raqam, nuqta, chiziqcha; 3–30 belgi. */
export const LOGIN_PATTERN = /^(?=.*[a-z])[a-z0-9][a-z0-9.-]{2,29}$/;

/** "90 123 45 67", "+998901234567" -> "998901234567"; noto'g'ri bo'lsa null. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 9) return `998${digits}`;
  if (digits.length === 12 && digits.startsWith("998")) return digits;
  return null;
}

/** "998901234567" -> "+998 90 123 45 67". */
export function formatPhone(digits: string): string {
  const m = digits.match(/^(998)(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]}` : digits;
}

export type Identity =
  | { kind: "email"; value: string }
  | { kind: "phone"; value: string }
  | { kind: "login"; value: string };

/** Kiritilgan qiymat qaysi turga tegishli ekanini aniqlaydi (yaroqsiz bo'lsa null). */
export function parseIdentity(input: string): Identity | null {
  const v = input.trim().toLowerCase();
  if (!v) return null;
  if (v.includes("@")) return { kind: "email", value: v };
  if (/^[+\d\s()-]+$/.test(v)) {
    const phone = normalizePhone(v);
    return phone ? { kind: "phone", value: phone } : null;
  }
  return LOGIN_PATTERN.test(v) ? { kind: "login", value: v } : null;
}

/** Super admin hisoblari uchun maxsus "maktab" nomi (admin subdomenida slug bo'lmaydi). */
export const PLATFORM_SLUG = "platform";

/**
 * Supabase Auth uchun ichki email. Foydalanuvchi faqat telefon/login va parol bilan ishlaydi;
 * slug berilmasa (admin subdomeni) hisob "platform" nomi ostida qidiriladi.
 * "@" bor kiritma faqat eski hisoblar uchun o'zgarishsiz qabul qilinadi.
 */
export function identityToEmail(input: string, slug?: string): string | null {
  const identity = parseIdentity(input);
  if (!identity) return null;
  if (identity.kind === "email") return identity.value;
  return `${identity.value}__${slug ?? PLATFORM_SLUG}@${IDENTITY_DOMAIN}`;
}

/** Ichki emaildan ko'rsatiladigan login (telefon yoki login); haqiqiy email bo'lsa null. */
export function loginFromEmail(email: string | null | undefined): string | null {
  if (!email?.endsWith(`@${IDENTITY_DOMAIN}`)) return null;
  const login = email.slice(0, email.indexOf("__"));
  return /^998\d{9}$/.test(login) ? formatPhone(login) : login;
}
