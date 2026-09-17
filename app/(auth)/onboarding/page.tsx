import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "@/components/auth/AuthCard";
import { CreateOrganizationForm } from "@/components/auth/CreateOrganizationForm";

/**
 * Kirgan, lekin hech qaysi muassasaga a'zo bo'lmagan foydalanuvchi:
 * xodim bo'lsa direktordan taklif havolasini oladi, aks holda o'z
 * muassasasini ochadi.
 */
export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: member }, { data: ownOrg }] = await Promise.all([
    supabase.from("org_members").select("org_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("organizations").select("id").eq("owner_id", user.id).maybeSingle(),
  ]);
  if (member || ownOrg) redirect("/");

  return (
    <AuthCard
      title="Muassasaga ulaning"
      subtitle={
        <>
          <span className="font-medium text-ink">{user.email}</span> hisobi hech qaysi
          muassasaga biriktirilmagan.
        </>
      }
    >
      <div className="mb-6 rounded-lg bg-canvas px-3 py-3 text-sm text-ink-muted">
        <span className="font-medium text-ink">Xodimmisiz?</span> Direktordan taklif havolasini
        so&apos;rang va o&apos;sha havolani oching.
      </div>

      <h2 className="mb-3 text-sm font-semibold text-ink">Yoki o&apos;z muassasangizni oching</h2>
      <CreateOrganizationForm />
    </AuthCard>
  );
}
