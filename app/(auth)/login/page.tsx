import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";
import { resolveHost } from "@/lib/tenant";

/**
 * Kirish sahifasi manzilga qarab o'zgaradi: maktab subdomenida maktab nomi,
 * admin subdomenida "Super Admin". Mavjud bo'lmagan subdomen — 404.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const params = await searchParams;
  const host = resolveHost((await headers()).get("host"));

  if (host.kind === "tenant") {
    const supabase = await createClient();
    const { data } = await supabase.rpc("org_public_by_slug", { p_slug: host.slug });
    const org = (Array.isArray(data) ? data[0] : data) as { name: string } | null | undefined;
    if (!org) notFound();

    return (
      <LoginForm
        title={org.name}
        subtitle="Tizimga kirish — o'z login va parolingizni kiriting"
        notice={
          params.registered
            ? "Maktabingiz ro'yxatdan o'tdi. Ro'yxatdan o'tishda kiritgan email va parol bilan kiring."
            : undefined
        }
      />
    );
  }

  if (host.kind === "admin") {
    return <LoginForm title="Super Admin" subtitle="Platforma boshqaruvi — faqat administratorlar uchun" />;
  }

  return <LoginForm title="Tizimga kirish" subtitle="Hisobingizga kiring" />;
}
