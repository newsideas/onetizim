"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setOrgPlan, type PlanChange } from "@/lib/actions/platform";
import type { EffectiveStatus } from "@/lib/platform";

const buttonClass =
  "rounded-md border border-line px-2 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-50";

/** Maktab obunasini boshqarish: sinovni uzaytirish, faollashtirish, to'xtatish. */
export function OrgPlanControls({
  orgId,
  orgName,
  status,
}: {
  orgId: string;
  orgName: string;
  status: EffectiveStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function apply(change: PlanChange, question: string) {
    if (!confirm(`${orgName}\n\n${question}`)) return;
    setError(undefined);
    startTransition(async () => {
      const result = await setOrgPlan(orgId, change);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={isPending}
          onClick={() => apply({ kind: "extend", days: 14 }, "Sinov muddati 14 kunga uzaytirilsinmi?")}
          className={buttonClass}
        >
          +14 kun
        </button>
        {status !== "active" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => apply({ kind: "activate" }, "Faol obuna sifatida belgilansinmi?")}
            className={buttonClass}
          >
            Faollashtirish
          </button>
        )}
        {status !== "expired" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => apply({ kind: "expire" }, "Obuna to'xtatilsinmi?")}
            className={`${buttonClass} hover:text-red-600`}
          >
            To&apos;xtatish
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
