import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { ExpiredActions } from "@/components/auth/ExpiredActions";
import { createClient } from "@/lib/supabase/server";

/**
 * Kirgan, lekin shu subdomen maktabining a'zosi bo'lmagan foydalanuvchi.
 * Har maktab faqat o'z login-parollari bilan ochiladi.
 */
export default async function NoAccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AuthCard
      title="Bu maktabga kirish huquqingiz yo'q"
      subtitle={
        <>
          <span className="font-medium text-ink">{user.email}</span> hisobi bu maktabning
          a&apos;zosi emas.
        </>
      }
    >
      <div className="mb-6 rounded-lg bg-canvas px-4 py-3 text-sm text-ink-muted">
        Har maktab faqat o&apos;z xodimlari uchun ochiq. Agar siz bu maktab xodimi bo&apos;lsangiz,
        direktordan taklif havolasini so&apos;rang. Boshqa hisob bilan kirish uchun chiqing.
      </div>
      <ExpiredActions />
    </AuthCard>
  );
}
