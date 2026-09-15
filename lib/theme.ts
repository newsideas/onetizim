/**
 * Mavzu tanlovi cookie'da saqlanadi.
 *
 * Nomni alohida (client bo'lmagan) modulda saqlaymiz: "use client"
 * fayldan import qilinganda server komponent haqiqiy qiymatni emas,
 * client havolasini oladi va cookie topilmay qoladi.
 */
export const THEME_COOKIE = "edugram-theme";

export type Theme = "light" | "dark";

/** Cookie qiymati ishonchsiz — faqat ma'lum ikkita qiymatni qabul qilamiz. */
export function parseTheme(value: string | undefined): Theme | undefined {
  return value === "light" || value === "dark" ? value : undefined;
}
