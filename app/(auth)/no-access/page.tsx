import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { ExpiredActions } from "@/components/auth/ExpiredActions";
import { createClient } from "@/lib/supabase/server";
import { loginFromEmail } from "@/lib/auth/identity";

/**
 * Kirgan, lekin shu subdomen markazining a'zosi bo'lmagan foydalanuvchi.
 * Har markaz faqat o'z login-parollari bilan ochiladi.
 */
export default async function NoAccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AuthCard
      title="Bu markazga kirish huquqingiz yo'q"
      subtitle={
        <>
          <span className="font-medium text-ink">{loginFromEmail(user.email) ?? "Bu hisob"}</span> bu markazning
          a&apos;zosi emas.
        </>
      }
    >
      <div className="mb-6 rounded-lg bg-canvas px-4 py-3 text-sm text-ink-muted">
        Har markaz faqat o&apos;z xodimlari uchun ochiq. Agar siz bu markaz xodimi bo&apos;lsangiz,
        direktordan login va parol so&apos;rang. Boshqa hisob bilan kirish uchun chiqing.
      </div>
      <ExpiredActions />
    </AuthCard>
  );
}
