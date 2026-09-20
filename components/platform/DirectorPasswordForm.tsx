"use client";

import { useState, useTransition, type FormEvent } from "react";
import { resetDirectorPassword } from "@/lib/actions/platform";
import { generatePassword } from "@/lib/auth/passwords";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

/** Direktor parolini unutganda yangi parol qo'yish; parolni super admin direktorga o'zi yetkazadi. */
export function DirectorPasswordForm({ orgId }: { orgId: string }) {
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [doneWith, setDoneWith] = useState<string>();

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setDoneWith(undefined);
    startTransition(async () => {
      const result = await resetDirectorPassword(orgId, password);
      if (!result.ok) return setError(result.error);
      setDoneWith(password);
      setPassword("");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div>
        <Label htmlFor="director-password">Yangi parol</Label>
        <div className="flex gap-2">
          <Input
            id="director-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            placeholder="Kamida 6 ta belgi"
          />
          <Button type="button" variant="secondary" onClick={() => setPassword(generatePassword())}>
            Yaratish
          </Button>
        </div>
      </div>
      <FormError message={error} />
      {doneWith && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          Parol yangilandi: <span className="font-mono font-semibold">{doneWith}</span> — direktorga yetkazing.
        </p>
      )}
      <Button type="submit" disabled={isPending || password.length < 6}>
        {isPending ? "Saqlanmoqda..." : "Parolni yangilash"}
      </Button>
    </form>
  );
}
