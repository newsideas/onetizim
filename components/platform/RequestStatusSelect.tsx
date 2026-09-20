"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setDemoRequestStatus } from "@/lib/actions/demo-requests";

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  new: "Yangi",
  contacted: "Bog'lanildi",
  opened: "Markaz ochildi",
  rejected: "Rad etildi",
};

/** Ariza holatini almashtirish (super admin "Arizalar" jadvalida). */
export function RequestStatusSelect({ requestId, status }: { requestId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string>();

  function change(next: string) {
    const previous = value;
    setValue(next);
    setError(undefined);
    startTransition(async () => {
      const result = await setDemoRequestStatus(requestId, next);
      if (!result.ok) {
        setValue(previous);
        return setError(result.error);
      }
      router.refresh();
    });
  }

  return (
    <div>
      <select
        value={value}
        onChange={(e) => change(e.target.value)}
        disabled={isPending}
        aria-label="Ariza holati"
        className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink focus:border-brand-500 focus:outline-none disabled:opacity-60"
      >
        {Object.entries(REQUEST_STATUS_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
