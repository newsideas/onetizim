/** Kelmagan o'quvchi uchun tayyor sabablar (davomat belgilash va ko'rish oynalarida ishlatiladi). */
export const ABSENCE_REASONS = ["Sababsiz", "Kasal", "Oilaviy sabab", "Sayohat", "Boshqa"] as const;

export const ATTENDANCE_STATUS_LABELS = {
  present: "Keldi",
  late: "Kechikdi",
  absent: "Kelmadi",
} as const;
