import { MessageSquareOff } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { ListPageShell } from "@/components/ui/ListPage";

/**
 * Haqiqiy SMS provayder (masalan SMSAPI.UZ, Eskiz.uz) hali ulanmagan —
 * shuning uchun bu yerda ishlamaydigan "sozlamalar" formasi ko'rsatilmaydi,
 * faqat halol holat va keyingi qadam yoziladi.
 */
export default async function SmsPage() {
  await requirePermission("notifications.manage");
  const configured = Boolean(process.env.SMS_PROVIDER_API_KEY);

  return (
    <ListPageShell title="SMS" subtitle="SMS orqali eslatmalar">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-line p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
          <MessageSquareOff size={22} aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-ink">
          {configured ? "SMS ulangan" : "SMS hali ulanmagan"}
        </h2>
        <p className="max-w-md text-sm text-ink-muted">
          {configured
            ? "Provayder sozlangan. Davomat/qarzdorlik xabarlari hozircha faqat Telegram orqali yuboriladi — SMS'ni asosiy kanal sifatida yoqish keyingi bosqichda qo'shiladi."
            : "Hozircha ota-onalarga xabarlar faqat Telegram bot orqali yuboriladi (Xabarnomalar bo'limi). SMS yoqish uchun O'zbekiston SMS-gateway provayderi (masalan SMSAPI.UZ yoki Eskiz.uz) bilan hisob ochib, API kalitini berishingiz kerak — soxta yoki ishlamaydigan sozlama qo'shilmadi."}
        </p>
      </div>
    </ListPageShell>
  );
}
