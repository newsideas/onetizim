"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { setCenterSubdomain } from "@/lib/actions/centers";
import { PUBLIC_DOMAIN, suggestSlug } from "@/lib/tenant";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

/** Markaz subdomenini belgilash yoki o'zgartirish (renessans.edugram.uz). */
export function SubdomainForm({ orgId, orgName, currentSlug }: { orgId: string; orgName: string; currentSlug: string | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [slug, setSlug] = useState(currentSlug ?? suggestSlug(orgName));
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSaved(false);
    startTransition(async () => {
      const result = await setCenterSubdomain(orgId, slug);
      if (!result.ok) return setError(result.error);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div>
        <Label htmlFor="subdomain">Subdomen</Label>
        <div className="flex items-stretch">
          <Input
            id="subdomain"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            autoComplete="off"
            className="rounded-r-none"
          />
          <span className="flex items-center rounded-r-lg border border-l-0 border-line bg-canvas px-3 text-sm text-ink-muted">
            .{PUBLIC_DOMAIN}
          </span>
        </div>
      </div>
      <FormError message={error} />
      {saved && <p className="text-sm text-emerald-600 dark:text-emerald-400">Subdomen saqlandi</p>}
      {currentSlug && currentSlug !== slug && (
        <p className="text-xs text-amber-600">
          Manzil o&apos;zgartirilsa, xodimlar yangi manzildan kiradi (login va parollari o&apos;zgarmaydi).
        </p>
      )}
      <Button type="submit" disabled={isPending || !slug}>
        {isPending ? "Saqlanmoqda..." : currentSlug ? "O'zgartirish" : "Subdomenni yaratish"}
      </Button>
    </form>
  );
}
