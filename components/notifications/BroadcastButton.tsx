"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { financeInputClass } from "@/components/finance/MoneyEntryModal";
import { sendBroadcast } from "@/lib/actions/notifications";

export interface GroupOption {
  id: string;
  name: string;
}

export function BroadcastButton({ groups, groupLabel }: { groups: GroupOption[]; groupLabel: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [sentCount, setSentCount] = useState<number>();

  const [audience, setAudience] = useState<"all" | "group">("all");
  const [groupId, setGroupId] = useState("");
  const [message, setMessage] = useState("");

  function close() {
    setOpen(false);
    setAudience("all");
    setGroupId("");
    setMessage("");
    setError(undefined);
    setSentCount(undefined);
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (message.trim().length < 3) return setError("Xabar matnini kiriting");
    if (audience === "group" && !groupId) return setError(`${groupLabel}ni tanlang`);

    setError(undefined);
    startTransition(async () => {
      const result = await sendBroadcast({ audience, groupId: groupId || undefined, message });
      if (!result.ok) return setError(result.error);
      setSentCount(result.data);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
      >
        <Send size={16} aria-hidden="true" />
        Ommaviy xabar
      </button>

      {open && (
        <Modal open onClose={isPending ? () => {} : close} title="Ommaviy xabar yuborish">
          {sentCount !== undefined ? (
            <div className="space-y-3">
              <p className="rounded-lg bg-brand-50 px-3 py-2.5 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                Xabar {sentCount} ta ota-onaga yuborildi.
              </p>
              <Button type="button" variant="secondary" onClick={close}>
                Yopish
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div>
                <span className="mb-1.5 block text-xs font-medium text-ink-muted">Qabul qiluvchilar</span>
                <div className="flex gap-4 text-sm text-ink">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="audience"
                      checked={audience === "all"}
                      onChange={() => setAudience("all")}
                      disabled={isPending}
                    />
                    Hammaga
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="audience"
                      checked={audience === "group"}
                      onChange={() => setAudience("group")}
                      disabled={isPending}
                    />
                    Bitta {groupLabel.toLowerCase()}ga
                  </label>
                </div>
              </div>

              {audience === "group" && (
                <div>
                  <label htmlFor="broadcast-group" className="mb-1.5 block text-xs font-medium text-ink-muted">
                    {groupLabel} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="broadcast-group"
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    disabled={isPending}
                    className={financeInputClass}
                  >
                    <option value="">Tanlang</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="broadcast-message" className="mb-1.5 block text-xs font-medium text-ink-muted">
                  Xabar matni <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="broadcast-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={1000}
                  autoFocus
                  disabled={isPending}
                  className={financeInputClass}
                />
              </div>

              <p className="text-xs text-ink-faint">
                Faqat Telegram botni ulagan ota-onalar xabarni oladi.
              </p>

              <FormError message={error} />

              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Yuborilmoqda..." : "Yuborish"}
                </Button>
                <Button type="button" variant="secondary" onClick={close} disabled={isPending}>
                  Bekor qilish
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
