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

/** "14:30:00" -> 870 (yarim tundan boshlab daqiqalar). */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** 870 -> "14:30". */
export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Bugungi kunning o'zbekcha nomi. */
export function bugungiKun(): string {
  const jsDay = new Date().getDay(); // 0 = Yakshanba
  return HAFTA_KUNLARI[(jsDay + 6) % 7];
}

/**
 * Berilgan sanagacha necha kun qolganini qaytaradi (bugun = 0).
 * Sana yo'q bo'lsa null — chaqiruvchi ko'rsatkichni umuman chizmaydi.
 */
export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;

  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return null;

  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const diffMs = startOfDay(target) - startOfDay(new Date());
  return Math.round(diffMs / 86_400_000);
}
