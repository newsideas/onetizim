"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Copy } from "lucide-react";
import { createCenter } from "@/lib/actions/centers";
import { setDemoRequestStatus } from "@/lib/actions/demo-requests";
import { formatPhone } from "@/lib/auth/identity";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

interface Created {
  orgId: string;
  name: string;
  phone: string;
  password: string;
}

/** Super admin uchun: yangi o'quv markaz — faqat nom, rahbar, telefon va joylashuv; parol avtomatik. */
export function CreateCenterForm({
  initial,
}: {
  /** "Arizalar" bo'limidan kelganda: ariza ma'lumotlari va ariza id'si (markaz ochilgach "Markaz ochildi" belgilanadi). */
  initial?: { requestId?: string; orgName?: string; directorName?: string; phone?: string };
}) {
  const [orgName, setOrgName] = useState(initial?.orgName ?? "");
  const [directorName, setDirectorName] = useState(initial?.directorName ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "+998");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setPending(true);
    const result = await createCenter({ orgName, directorName, phone, location });
    setPending(false);
    if (!result.ok) return setError(result.error);
    setCreated(result.data);
    // Ariza asosida ochilgan bo'lsa, arizani "Markaz ochildi" deb belgilaymiz (xato bo'lsa e'tiborsiz).
    if (initial?.requestId) void setDemoRequestStatus(initial.requestId, "opened");
  }

  async function copyCredentials(c: Created) {
    try {
      await navigator.clipboard.writeText(`Login: ${formatPhone(c.phone)}\nParol: ${c.password}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (created) {
    return (
      <div className="max-w-xl space-y-5 rounded-xl border border-line bg-surface p-6">
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle2 size={20} aria-hidden="true" />
          <h2 className="text-base font-semibold text-ink">{created.name} ochildi</h2>
        </div>

        <dl className="divide-y divide-line rounded-lg border border-line text-sm">
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-ink-muted">Login</dt>
            <dd className="font-medium text-ink">{formatPhone(created.phone)}</dd>
          </div>
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-ink-muted">Parol</dt>
            <dd className="font-mono font-semibold text-ink">{created.password}</dd>
          </div>
        </dl>

        <p className="text-xs text-ink-faint">
          Parol faqat hozir ko&apos;rinadi — direktorga yetkazing. Unutilsa, markaz sahifasida yangisini qo&apos;yasiz.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => copyCredentials(created)} className="inline-flex items-center gap-2">
            <Copy size={15} /> {copied ? "Nusxalandi" : "Nusxalash"}
          </Button>
          <Link
            href={`/admin/organizations/${created.orgId}`}
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Subdomen belgilash
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4 rounded-xl border border-line bg-surface p-6" noValidate>
      <div>
        <Label htmlFor="center-name">
          Markaz nomi<span className="ml-0.5 text-red-500">*</span>
        </Label>
        <Input id="center-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Markaz nomi" />
      </div>
      <div>
        <Label htmlFor="center-director">
          Rahbar F.I.Sh<span className="ml-0.5 text-red-500">*</span>
        </Label>
        <Input
          id="center-director"
          value={directorName}
          onChange={(e) => setDirectorName(e.target.value)}
          placeholder="Familiyasi Ismi"
        />
      </div>
      <div>
        <Label htmlFor="center-phone">
          Telefon nomer (kirish logini)<span className="ml-0.5 text-red-500">*</span>
        </Label>
        <Input
          id="center-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="+998 90 123 45 67"
        />
      </div>
      <div>
        <Label htmlFor="center-location">Joylashuv</Label>
        <Input
          id="center-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Viloyat, shahar, manzil"
        />
      </div>

      <FormError message={error} />

      <Button type="submit" disabled={pending}>
        {pending ? "Ochilmoqda..." : "Markazni ochish"}
      </Button>
      <p className="text-xs text-ink-faint">
        Parol avtomatik yaratiladi. Subdomenni markaz ochilgach uning sahifasida belgilaysiz.
      </p>
    </form>
  );
}
