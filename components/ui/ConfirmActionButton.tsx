"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { ActionResult } from "@/lib/actions/result";

/** Tasdiqlashdan keyin server action'ni chaqiradigan kichik ikonka tugma. */
export function ConfirmActionButton({
  action,
  confirmText,
  label = "O'chirish",
}: {
  action: () => Promise<ActionResult<unknown>>;
  confirmText: string;
  label?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    if (!confirm(confirmText)) return;
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={run}
        disabled={isPending}
        aria-label={label}
        title={label}
        className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
      >
        <Trash2 size={15} />
      </button>
      {error && <span className="mt-1 max-w-[160px] text-xs text-red-600">{error}</span>}
    </span>
  );
}
