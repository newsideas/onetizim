import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationKind = "absent" | "debt" | "payment" | "broadcast";
export type NotificationChannel = "telegram" | "sms";

export const NOTIFICATION_KIND_LABELS: Record<NotificationKind, string> = {
  absent: "Davomat (kelmadi)",
  debt: "Qarzdorlik",
  payment: "To'lov qabul qilindi",
  broadcast: "Ommaviy xabar",
};

/**
 * Yuborilgan (yoki yuborishga urinilgan) bildirishnomani yozib qo'yadi.
 * Bu — faqat audit uchun, shuning uchun xato bo'lsa ham asosiy amalni
 * (davomat belgilash, to'lov qabul qilish) buzmasligi kerak.
 */
export async function logNotification(
  supabase: SupabaseClient,
  params: {
    orgId: string;
    studentId?: string | null;
    channel?: NotificationChannel;
    kind: NotificationKind;
    message: string;
    success: boolean;
  },
) {
  try {
    await supabase.from("notification_log").insert({
      org_id: params.orgId,
      student_id: params.studentId ?? null,
      channel: params.channel ?? "telegram",
      kind: params.kind,
      message: params.message,
      success: params.success,
    });
  } catch (e) {
    console.error("Bildirishnoma logini yozib bo'lmadi:", e);
  }
}
