import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { ExpiredActions } from "@/components/auth/ExpiredActions";
import { getSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils/date";

/**
 * Obunasi (sinov muddati) tugagan yoki to'xtatilgan maktab foydalanuvchilari
 * shu yerga tushadi. Bu sahifa (dashboard) ichida emas — aks holda cheksiz
 * yo'naltirish bo'lardi. Obuna faol bo'lsa bosh sahifaga qaytariladi.
 */
export default async function SubscriptionExpiredPage() {
  const { org, role, expired } = await getSession();
  if (!expired) redirect("/");

  const stopped = org.plan === "expired";

  return (
    <AuthCard
      title="Obuna muddati tugagan"
      subtitle={
        <>
          <span className="font-medium text-ink">{org.name}</span> —{" "}
          {stopped
            ? "obuna to'xtatilgan."
            : `sinov muddati ${org.trial_ends_at ? formatDate(org.trial_ends_at) : ""} kuni tugagan.`}
        </>
      }
    >
      <div className="mb-6 space-y-2 rounded-lg bg-canvas px-4 py-3 text-sm text-ink-muted">
        <p>
          Tizimdan foydalanish vaqtincha to&apos;xtatildi. Ma&apos;lumotlaringiz saqlanib turibdi —
          obuna qayta yoqilishi bilan hammasi joyida bo&apos;ladi.
        </p>
        <p>
          {role === "owner"
            ? "Obunani davom ettirish uchun EduGram administratori bilan bog'laning."
            : "Iltimos, muassasa direktoriga murojaat qiling."}
        </p>
      </div>
      <ExpiredActions />
    </AuthCard>
  );
}
