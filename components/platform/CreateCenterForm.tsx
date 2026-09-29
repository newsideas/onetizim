"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { createCenter } from "@/lib/actions/centers";
import { setDemoRequestStatus } from "@/lib/actions/demo-requests";
import { formatPhone } from "@/lib/auth/identity";
import { PUBLIC_DOMAIN, suggestSlug, tenantUrl } from "@/lib/tenant";
import { SEGMENTS, SEGMENT_TERMS, type Segment } from "@/lib/segment";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

interface Created {
  orgId: string;
  name: string;
  phone: string;
  password: string;
  slug: string | null;
}

/** Direktorga yuboriladigan rasmiy manzil (https://renessans.onetizim.uz). */
const publicUrl = (slug: string) => `https://${slug}.${PUBLIC_DOMAIN}`;

/** Super admin uchun: yangi o'quv markaz — nom, rahbar, telefon, joylashuv va subdomen; parol avtomatik. */
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
  const [type, setType] = useState<Segment>("markaz");
  const [slug, setSlug] = useState(suggestSlug(initial?.orgName ?? ""));
  // Foydalanuvchi subdomenni o'zi yozmaguncha u markaz nomidan avtomatik taklif qilinadi.
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  function changeName(value: string) {
    setOrgName(value);
    if (!slugTouched) setSlug(suggestSlug(value));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!slug.trim()) return setError("Subdomenni kiriting (lotin harflarida, masalan: renessans)");
    setPending(true);
    const result = await createCenter({ orgName, directorName, phone, location, slug, type });
    setPending(false);
    if (!result.ok) return setError(result.error);
    setCreated(result.data);
    // Ariza asosida ochilgan bo'lsa, arizani "Markaz ochildi" deb belgilaymiz (xato bo'lsa e'tiborsiz).
    if (initial?.requestId) void setDemoRequestStatus(initial.requestId, "opened");
  }

  async function copyCredentials(c: Created) {
    const lines = [
      ...(c.slug ? [`Manzil: ${publicUrl(c.slug)}`] : []),
      `Login: ${formatPhone(c.phone)}`,
      `Parol: ${c.password}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
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
          {created.slug && (
            <div className="flex justify-between gap-4 px-4 py-3">
              <dt className="text-ink-muted">Manzil</dt>
              <dd className="font-medium break-all text-ink">{publicUrl(created.slug)}</dd>
            </div>
          )}
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
          Parol faqat hozir ko&apos;rinadi — manzil, login va parolni direktorga yetkazing. Unutilsa, markaz sahifasida
          yangisini qo&apos;yasiz.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => copyCredentials(created)}
            className="inline-flex items-center gap-2"
          >
            <Copy size={15} /> {copied ? "Nusxalandi" : "Nusxalash"}
          </Button>
          {created.slug && (
            <a
              href={tenantUrl(created.slug, "/login", window.location)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas"
            >
              <ExternalLink size={15} /> Kirish sahifasini ochish
            </a>
          )}
          <Link
            href={`/admin/organizations/${created.orgId}`}
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            {created.slug ? "Markaz sahifasi" : "Subdomen belgilash"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4 rounded-xl border border-line bg-surface p-6" noValidate>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">
          Turi<span className="ml-0.5 text-red-500">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SEGMENTS.map((s) => {
            const t = SEGMENT_TERMS[s];
            const Icon = t.icon;
            const active = type === s;
            return (
              <label
                key={s}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  active ? "border-brand-600 bg-brand-50" : "border-line hover:bg-canvas"
                }`}
              >
                <input
                  type="radio"
                  name="center-type"
                  value={s}
                  checked={active}
                  onChange={() => setType(s)}
                  className="sr-only"
                />
                <Icon size={20} className={active ? "text-brand-600" : "text-ink-muted"} aria-hidden="true" />
                <span>
                  <span className="block text-sm font-medium text-ink">{t.label}</span>
                  <span className="block text-xs text-ink-muted">{t.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div>
        <Label htmlFor="center-name">
          Markaz nomi<span className="ml-0.5 text-red-500">*</span>
        </Label>
        <Input id="center-name" value={orgName} onChange={(e) => changeName(e.target.value)} placeholder="Markaz nomi" />
      </div>
      <div>
        <Label htmlFor="center-slug">
          Subdomen (kirish manzili)<span className="ml-0.5 text-red-500">*</span>
        </Label>
        <div className="flex items-stretch">
          <Input
            id="center-slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
            }}
            autoComplete="off"
            placeholder="renessans"
            className="rounded-r-none"
          />
          <span className="flex items-center rounded-r-lg border border-l-0 border-line bg-canvas px-3 text-sm text-ink-muted">
            .{PUBLIC_DOMAIN}
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-faint">Lotin harf, raqam va chiziqcha. Markaz shu manzildan kiradi.</p>
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
      <p className="text-xs text-ink-faint">Parol avtomatik yaratiladi.</p>
    </form>
  );
}
