import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";
import { resolveHost } from "@/lib/tenant";

/**
 * Kirish sahifasi manzilga qarab o'zgaradi: markaz subdomenida markaz nomi
 * va telefon/login bilan kirish, admin subdomenida Super Admin (email).
 * Mavjud bo'lmagan subdomen — 404.
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
        schoolName={org.name}
        slug={host.slug}
        notice={
          params.registered
            ? "Markazingiz ochildi. Telefon raqamingiz va parolingiz bilan kiring."
            : undefined
        }
      />
    );
  }

  return <LoginForm schoolName={host.kind === "admin" ? "Super Admin" : undefined} />;
}
