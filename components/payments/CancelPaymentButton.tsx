"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelPayment } from "@/lib/actions/payments";
import { unwrap } from "@/lib/actions/result";
import { useDialogs } from "@/components/ui/ConfirmDialog";

export function CancelPaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const { prompt, dialogs } = useDialogs();

  async function handleClick() {
    const reason = await prompt("To'lov bekor qilinsinmi? O'quvchi balansi qaytariladi.", {
      title: "To'lovni bekor qilish",
      placeholder: "Bekor qilish sababi (ixtiyoriy)",
      confirmLabel: "Ha, bekor qilish",
    });
    if (reason === null) return;

    setError(undefined);
    setPending(true);
    try {
      unwrap(await cancelPayment(paymentId, reason));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "To'lovni bekor qilib bo'lmadi");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? "..." : "Bekor qilish"}
      </button>
      {error && <span className="mt-1 max-w-[180px] text-right text-xs text-red-600">{error}</span>}
      {dialogs}
    </span>
  );
}
