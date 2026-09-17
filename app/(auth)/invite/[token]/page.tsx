import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "@/components/auth/AuthCard";
import { AcceptInvite, InviteSignup } from "@/components/auth/InviteActions";
import { ROLE_LABELS, isRole } from "@/lib/auth/permissions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface InviteInfo {
  org_name: string;
  role: string;
  full_name: string | null;
  status: "pending" | "accepted" | "expired";
}

const STATUS_TEXT = {
  accepted: "Bu taklif allaqachon qabul qilingan.",
  expired: "Taklif muddati tugagan. Direktordan yangi havola so'rang.",
};

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  let invite: InviteInfo | null = null;
  if (UUID.test(token)) {
    const { data } = await supabase.rpc("get_invite", { p_token: token });
    invite = ((data as InviteInfo[] | null) ?? [])[0] ?? null;
  }

  if (!invite) {
    return (
      <AuthCard title="Taklif topilmadi" subtitle="Havola noto'g'ri yoki bekor qilingan.">
        <Link href="/login" className="text-sm font-medium text-brand-600 hover:underline">
          Kirish sahifasiga o&apos;tish
        </Link>
      </AuthCard>
    );
  }

  const roleLabel = isRole(invite.role) ? ROLE_LABELS[invite.role] : invite.role;
  const subtitle = (
    <>
      <span className="font-medium text-ink">{invite.org_name}</span> sizni{" "}
      <span className="font-medium text-ink">{roleLabel}</span> sifatida tizimga taklif qildi
      {invite.full_name ? ` (${invite.full_name})` : ""}.
    </>
  );

  if (invite.status !== "pending") {
    return (
      <AuthCard title="Taklif" subtitle={subtitle}>
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {STATUS_TEXT[invite.status]}
        </p>
      </AuthCard>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AuthCard title="Jamoaga qo'shilish" subtitle={subtitle}>
      {user ? (
        <AcceptInvite token={token} email={user.email ?? ""} />
      ) : (
        <InviteSignup token={token} />
      )}
    </AuthCard>
  );
}
