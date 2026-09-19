"use client";

import { useState, type FormEvent } from "react";
import { ROOT_DOMAIN, isValidSlug, tenantUrl } from "@/lib/tenant";
import { Button } from "@/components/ui/Button";

/** Maktab manzilini kiritib, o'sha maktabning kirish sahifasiga o'tish. */
export function FindSchoolForm() {
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string>();

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = slug.trim().toLowerCase();
    if (!isValidSlug(value)) return setError("Maktab manzilini to'g'ri kiriting (masalan: renessans)");
    setError(undefined);
    window.location.href = tenantUrl(value, "/login", window.location);
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <label htmlFor="school-slug" className="block text-sm font-medium text-ink">
        Maktabingiz manzili
      </label>
      <div className="flex items-center overflow-hidden rounded-lg border border-line bg-surface focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
        <input
          id="school-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="renessans"
          autoCapitalize="none"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-ink outline-none"
        />
        <span className="border-l border-line bg-canvas px-3 py-2.5 text-sm text-ink-muted">
          .{ROOT_DOMAIN}
        </span>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full">
        Kirish sahifasiga o&apos;tish
      </Button>
    </form>
  );
}
