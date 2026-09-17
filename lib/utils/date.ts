/**
 * Barcha "bugun", "shu oy" hisoblari Toshkent vaqti bo'yicha. Server (Vercel)
 * UTC'da ishlaydi: toISOString() soat 00:00–05:00 oralig'ida kechagi sanani
 * berardi va server bilan brauzer render'i farq qilardi.
 */
export const APP_TIME_ZONE = "Asia/Tashkent";

const isoDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const PLAIN_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Vaqt belgisini Toshkent bo'yicha YYYY-MM-DD ga aylantiradi. */
export function toIsoDay(date: Date | string): string {
  if (typeof date === "string" && PLAIN_DATE.test(date)) return date;
  return isoDayFormatter.format(typeof date === "string" ? new Date(date) : date);
}

/** Bugungi sana (Toshkent), YYYY-MM-DD. */
export function todayIso(): string {
  return toIsoDay(new Date());
}

function dayNumber(isoDay: string): number {
  const [y, m, d] = isoDay.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/**
 * Sana formati: kun.oy.yil (masalan 11.09.2026).
 */
export function formatDate(date: Date | string): string {
  const [year, month, day] = toIsoDay(date).split("-");
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
  const jsDay = new Date(dayNumber(todayIso()) * 86_400_000).getUTCDay(); // 0 = Yakshanba
  return HAFTA_KUNLARI[(jsDay + 6) % 7];
}

/**
 * Berilgan sanagacha necha kun qolganini qaytaradi (bugun = 0).
 * Sana yo'q bo'lsa null — chaqiruvchi ko'rsatkichni umuman chizmaydi.
 */
export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;

  if (!PLAIN_DATE.test(date) && Number.isNaN(new Date(date).getTime())) return null;
  return dayNumber(toIsoDay(date)) - dayNumber(todayIso());
}

/** "bugun", "kecha", "5 kun oldin" — kartalarda yozuv qancha turib qolganini ko'rsatish uchun. */
export function formatDaysAgo(date: string | null | undefined): string {
  const diff = daysUntil(date);
  if (diff === null) return "";
  const ago = -diff;
  if (ago <= 0) return "bugun";
  if (ago === 1) return "kecha";
  return `${ago} kun oldin`;
}

/** Oyning birinchi kuni, YYYY-MM-DD. Sana berilmasa — joriy oy (Toshkent). */
export function monthStartIso(date?: Date): string {
  if (!date) return `${todayIso().slice(0, 7)}-01`;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}-01`;
}

/** "2026-09" (input type=month) → "2026-09-01"; noto'g'ri bo'lsa joriy oy. */
export function parseMonth(value: string | undefined): string {
  if (value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return `${value}-01`;
  return monthStartIso();
}

export function nextMonth(periodStart: string): string {
  const [y, m] = periodStart.split("-").map(Number);
  return monthStartIso(new Date(y, m, 1));
}

/** `n` oy oldingi oyning 1-sanasi (n=0 — shu oyning o'zi). */
export function monthsAgo(n: number, from: string = monthStartIso()): string {
  const [y, m] = from.split("-").map(Number);
  return monthStartIso(new Date(y, m - 1 - n, 1));
}

export const MONTH_NAMES = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

/** "2026-09-01" → "Sentabr 2026". */
export function formatMonth(periodStart: string): string {
  const [y, m] = periodStart.split("-").map(Number);
  return `${MONTH_NAMES[m - 1] ?? ""} ${y}`;
}
