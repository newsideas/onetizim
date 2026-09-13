/**
 * Sana formati: kun.oy.yil (masalan 11.09.2026).
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Postgres "time" qiymatini qisqartiradi: "08:30:00" -> "08:30".
 */
export function formatTime(time: string | null): string {
  if (!time) return "";
  return time.slice(0, 5);
}

export const HAFTA_KUNLARI = [
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
  "Yakshanba",
] as const;
