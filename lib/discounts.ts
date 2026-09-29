/** O'quvchi chegirmasining tayyor sabablari va tavsiya etilgan foizlari (o'zgartirish mumkin). */
export const DISCOUNT_REASONS = [
  { label: "Aka-uka (opa-singil)", percent: 10 },
  { label: "A'lochi", percent: 15 },
  { label: "Xodim farzandi", percent: 50 },
  { label: "Ijtimoiy himoya", percent: 30 },
  { label: "Boshqa", percent: 0 },
] as const;

/** Chegirma qo'llangandan keyingi oylik narx (so'm, butun). */
export function discountedPrice(price: number, percent: number): number {
  return Math.round((price * (100 - percent)) / 100);
}
