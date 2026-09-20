"use client";

import { useState, useTransition, type FormEvent } from "react";
import { setAdminCredentials } from "@/lib/actions/platform";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

/** Super adminning kirishi: telefon raqam va parol (email ishlatilmaydi). */
export function AdminCredentialsForm({ currentLogin }: { currentLogin: string | null }) {
  const [isPending, startTransition] = useTransition();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSaved(false);
    startTransition(async () => {
      const result = await setAdminCredentials(phone, password);
      if (!result.ok) return setError(result.error);
      setPassword("");
      setSaved(true);
    });
  }

  return (
    <form onSubmit={submit} className="max-w-sm space-y-3" noValidate>
      <p className="text-sm text-ink-muted">
        Hozirgi kirish: <span className="font-medium text-ink">{currentLogin ?? "eski email hisobi"}</span>
      </p>
      <div>
        <Label htmlFor="admin-phone">Telefon raqam</Label>
        <Input
          id="admin-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+998 90 123 45 67"
          autoComplete="off"
        />
      </div>
      <div>
        <Label htmlFor="admin-password">Yangi parol</Label>
        <Input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <FormError message={error} />
      {saved && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Saqlandi. Keyingi kirishda telefon raqam va shu parol ishlatiladi.
        </p>
      )}
      <Button type="submit" disabled={isPending || !phone || password.length < 6}>
        {isPending ? "Saqlanmoqda..." : "Saqlash"}
      </Button>
    </form>
  );
}
