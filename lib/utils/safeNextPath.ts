/**
 * Kirishdan keyin qaytiladigan manzil. Faqat shu saytning ichki yo'li
 * qabul qilinadi — "//evil.com" yoki "https://..." kabi tashqi manzilga
 * yo'naltirib bo'lmaydi.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/";
  }
  return next;
}
