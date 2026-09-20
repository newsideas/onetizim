"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { ActionResult } from "@/lib/actions/result";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

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
  const [asking, setAsking] = useState(false);

  // Brauzerning confirm() oynasi o'rniga o'z oynamiz: dastur ichidagi brauzerda confirm() ko'rinmaydi.
  function run() {
    setAsking(false);
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
        onClick={() => setAsking(true)}
        disabled={isPending}
        aria-label={label}
        title={label}
        className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
      >
        <Trash2 size={15} />
      </button>
      {error && <span className="mt-1 max-w-[160px] text-xs text-red-600">{error}</span>}

      <Modal open={asking} onClose={() => setAsking(false)} title="Tasdiqlang">
        <p className="text-sm text-ink-muted">{confirmText}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setAsking(false)}>
            Bekor qilish
          </Button>
          <Button type="button" variant="danger" onClick={run}>
            Ha, {label.toLowerCase()}
          </Button>
        </div>
      </Modal>
    </span>
  );
}
