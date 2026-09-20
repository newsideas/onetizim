"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitDemoRequest } from "@/lib/actions/demo-requests";
import { unwrap } from "@/lib/actions/result";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

/** Rasmiy saytdagi "Demo uchun ariza" formasi: arizalar super adminda "Arizalar" bo'limiga tushadi. */
export function DemoRequestForm() {
  const [centerName, setCenterName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("+998");
  const [comment, setComment] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setPending(true);
    try {
      unwrap(await submitDemoRequest({ centerName, contactName, phone, comment, website }));
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 text-emerald-600" size={36} aria-hidden="true" />
        <h3 className="text-lg font-semibold text-ink">Arizangiz qabul qilindi</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Tez orada siz bilan bog&apos;lanib, markazingiz ma&apos;lumotlarini aniqlaymiz va demo ochib beramiz.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-surface p-6 sm:p-8" noValidate>
      <div>
        <Label htmlFor="demo-center">
          Markaz nomi<span className="ml-0.5 text-red-500">*</span>
        </Label>
        <Input id="demo-center" value={centerName} onChange={(e) => setCenterName(e.target.value)} placeholder="Masalan: Bilim o'quv markazi" />
      </div>
      <div>
        <Label htmlFor="demo-name">
          Ismingiz<span className="ml-0.5 text-red-500">*</span>
        </Label>
        <Input id="demo-name" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Familiya Ism" />
      </div>
      <div>
        <Label htmlFor="demo-phone">
          Telefon raqam<span className="ml-0.5 text-red-500">*</span>
        </Label>
        <Input
          id="demo-phone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+998 90 123 45 67"
        />
      </div>
      <div>
        <Label htmlFor="demo-comment">Izoh (ixtiyoriy)</Label>
        <textarea
          id="demo-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Nechta o'quvchi, qanday kurslar, savollaringiz..."
          className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
        />
      </div>

      {/* Spamdan himoya: odam ko'rmaydi va to'ldirmaydi. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="demo-website">Veb-sayt</label>
        <input id="demo-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <FormError message={error} />

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Yuborilmoqda..." : "Demo uchun ariza yuborish"}
      </Button>
      <p className="text-center text-xs text-ink-faint">7 kun bepul sinov. Kredit karta talab qilinmaydi.</p>
    </form>
  );
}
