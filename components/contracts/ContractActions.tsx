"use client";

import { unwrap, type ActionResult } from "@/lib/actions/result";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { deleteContract, setContractStatus } from "@/lib/actions/contracts";
import { useDialogs } from "@/components/ui/ConfirmDialog";
import { useContracts, type EditableContract } from "@/components/contracts/ContractsProvider";
import type { ContractStatus } from "@/lib/validations/contract";

const iconButton =
  "rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-canvas hover:text-ink disabled:opacity-40";

export function ContractActions({
  contract,
  status,
}: {
  contract: EditableContract;
  status: ContractStatus;
}) {
  const router = useRouter();
  const { openEdit } = useContracts();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialogs } = useDialogs();

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      try {
        unwrap(await action());
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
      }
    });
  }

  async function toggleStatus() {
    const next: ContractStatus = status === "active" ? "cancelled" : "active";
    const question =
      next === "cancelled" ? "Shartnomani bekor qilmoqchimisiz?" : "Shartnomani qayta faollashtirasizmi?";
    const options = {
      danger: next === "cancelled",
      confirmLabel: next === "cancelled" ? "Ha, bekor qilish" : "Ha, faollashtirish",
    };
    if (!(await confirm(question, options))) return;
    run(() => setContractStatus(contract.id, next));
  }

  async function remove() {
    const question = "Shartnoma va uning fayli butunlay o'chiriladi. Davom etasizmi?";
    if (!(await confirm(question, { danger: true, confirmLabel: "O'chirish" }))) return;
    run(() => deleteContract(contract.id));
  }

  const statusLabel = status === "active" ? "Bekor qilish" : "Faollashtirish";

  return (
    <div>
      {dialogs}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => openEdit(contract)}
          disabled={isPending}
          className={iconButton}
          aria-label="Tahrirlash"
          title="Tahrirlash"
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          onClick={toggleStatus}
          disabled={isPending}
          className={iconButton}
          aria-label={statusLabel}
          title={statusLabel}
        >
          {status === "active" ? <Ban size={15} /> : <RotateCcw size={15} />}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={isPending}
          className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
          aria-label="O'chirish"
          title="O'chirish"
        >
          <Trash2 size={15} />
        </button>
      </div>
      {error && <p className="mt-1 max-w-[180px] text-xs text-red-600">{error}</p>}
    </div>
  );
}
