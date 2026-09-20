"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

interface ConfirmOptions {
  title?: string;
  /** Tasdiqlash tugmasi matni (standart: "Ha"). */
  confirmLabel?: string;
  /** Xavfli amal (o'chirish, bekor qilish) — tasdiqlash tugmasi qizil bo'ladi. */
  danger?: boolean;
}

interface PromptOptions {
  title?: string;
  placeholder?: string;
  confirmLabel?: string;
  defaultValue?: string;
}

type Request =
  | ({ kind: "confirm"; message: string; resolve: (ok: boolean) => void } & ConfirmOptions)
  | ({ kind: "prompt"; message: string; resolve: (value: string | null) => void } & PromptOptions);

/**
 * Brauzerning `confirm()` va `prompt()` oynalari o'rniga: dastur ichidagi brauzerda ular
 * ko'rinmaydi va bosilganda jim bekor bo'ladi. Ishlatish:
 *
 *   const { confirm, prompt, dialogs } = useDialogs();
 *   if (!(await confirm("O'chirilsinmi?", { danger: true }))) return;
 *   ...
 *   return <>{...}{dialogs}</>;
 */
export function useDialogs() {
  const [request, setRequest] = useState<Request | null>(null);
  const [text, setText] = useState("");

  const confirm = useCallback(
    (message: string, options: ConfirmOptions = {}) =>
      new Promise<boolean>((resolve) => setRequest({ kind: "confirm", message, resolve, ...options })),
    [],
  );

  const prompt = useCallback(
    (message: string, options: PromptOptions = {}) =>
      new Promise<string | null>((resolve) => {
        setText(options.defaultValue ?? "");
        setRequest({ kind: "prompt", message, resolve, ...options });
      }),
    [],
  );

  function finish(accepted: boolean) {
    if (!request) return;
    if (request.kind === "confirm") request.resolve(accepted);
    else request.resolve(accepted ? text : null);
    setRequest(null);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    finish(true);
  }

  const dialogs = request ? (
    <Modal
      open
      onClose={() => finish(false)}
      title={request.title ?? (request.kind === "confirm" ? "Tasdiqlang" : "Ma'lumot kiriting")}
    >
      <form onSubmit={submit} className="space-y-4 text-left">
        <p className="text-sm whitespace-pre-line text-ink-muted">{request.message}</p>
        {request.kind === "prompt" && (
          <Input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={request.placeholder}
          />
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => finish(false)}>
            Bekor qilish
          </Button>
          <Button type="submit" variant={request.kind === "confirm" && request.danger ? "danger" : "primary"}>
            {request.confirmLabel ?? (request.kind === "confirm" ? "Ha" : "Saqlash")}
          </Button>
        </div>
      </form>
    </Modal>
  ) : null;

  return { confirm, prompt, dialogs };
}
