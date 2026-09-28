"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

/** Kutilmagan xato: foydalanuvchi texnik matn o'rniga tushunarli xabar va "Qayta urinish" tugmasini ko'radi. */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    // Server jurnalidagi yozuv bilan solishtirish uchun (digest).
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo className="h-8" />
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-ink">Nimadir xato ketdi</h1>
        <p className="max-w-md text-sm text-ink-muted">
          Sahifani yuklashda xatolik yuz berdi. Qayta urinib ko&apos;ring; takrorlansa, administratorga murojaat qiling.
        </p>
        {error.digest && <p className="text-xs text-ink-faint">Xato kodi: {error.digest}</p>}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Qayta urinish
        </button>
        <Link
          href="/"
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-canvas"
        >
          Bosh sahifa
        </Link>
      </div>
    </main>
  );
}
