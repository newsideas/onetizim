"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, X } from "lucide-react";
import { revokeInvite } from "@/lib/actions/staff";
import { ROLE_LABELS, isRole } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/utils/date";

export interface PendingInvite {
  id: string;
  token: string;
  role: string;
  full_name: string;
  expires_at: string;
}

function InviteLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Nusxalandi" : "Havolani nusxalash"}
    </button>
  );
}

export function PendingInvitesList({ invites }: { invites: PendingInvite[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove(invite: PendingInvite) {
    if (!confirm(`"${invite.full_name}"ga yuborilgan taklifni bekor qilmoqchimisiz?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await revokeInvite(invite.id);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  if (invites.length === 0) {
    return (
      <div className="rounded-xl border border-line p-6 text-center text-sm text-ink-faint">
        Hozircha kutilayotgan taklif yo&apos;q.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="divide-y divide-line rounded-xl border border-line">
        {invites.map((invite) => (
          <div key={invite.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-ink">{invite.full_name}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
                <span>{isRole(invite.role) ? ROLE_LABELS[invite.role] : invite.role}</span>
                <span>· {formatDate(invite.expires_at)}gacha amal qiladi</span>
                <InviteLink token={invite.token} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(invite)}
              disabled={isPending}
              className="shrink-0 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
              aria-label="Taklifni bekor qilish"
              title="Bekor qilish"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
