"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createReferenceItem, updateReferenceItem } from "@/lib/actions/references";
import { unwrap } from "@/lib/actions/result";
import { referencePath } from "@/lib/references";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";

const LIST_PATH = referencePath("contract-templates");

/** Shablon matniga qo'yiladigan maydonlar (Edu tizimdagi "Shartnoma maydonlari"). */
const TEMPLATE_FIELDS = [
  "Shartnoma raqami",
  "Ism",
  "Familiya",
  "Telefon raqami",
  "Email",
  "Tug'ilgan sana",
  "Dars turi",
  "Til",
  "To'lov sanasi",
  "Otasining ismi",
  "Onasining ismi",
  "Otasining telefon raqami",
  "Onasining telefon raqami",
];

/** Shartnoma shabloni: turi, raqami, sarlavhasi va maydonlar qo'yiladigan matn. */
export function ContractTemplateForm({
  templateId,
  types,
  initial,
}: {
  templateId?: string;
  types: { id: string; name: string }[];
  initial?: { number: string; title: string; typeId: string; body: string };
}) {
  const router = useRouter();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [typeId, setTypeId] = useState(initial?.typeId ?? "");
  const [number, setNumber] = useState(initial?.number ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  /** Tanlangan maydonni matndagi kursor o'rniga `{{Maydon}}` ko'rinishida qo'yadi. */
  function insertField(name: string) {
    const el = bodyRef.current;
    const token = `{{${name}}}`;
    if (!el) return setBody((b) => b + token);
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + token + body.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSaving(true);
    const formData = new FormData();
    formData.set("type_id", typeId);
    formData.set("number", number);
    formData.set("title", title);
    formData.set("body", body);
    try {
      unwrap(
        templateId
          ? await updateReferenceItem("contract-templates", templateId, formData)
          : await createReferenceItem("contract-templates", formData),
      );
      router.push(LIST_PATH);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Shartnoma</h2>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => window.print()}>
            Chop etish
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="space-y-4 rounded-xl border border-line bg-surface p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="ct-type">Shartnoma turi</Label>
              <Select id="ct-type" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
                <option value="">Tanlang</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="ct-number">Shartnoma raqami</Label>
              <Input id="ct-number" value={number} onChange={(e) => setNumber(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ct-title">
                Sarlavha<span className="ml-0.5 text-red-500">*</span>
              </Label>
              <Input id="ct-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </div>

          <div>
            <Label htmlFor="ct-body">Shartnoma matni</Label>
            <textarea
              id="ct-body"
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={18}
              className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none"
            />
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-line bg-surface p-4">
          <p className="mb-3 text-sm font-semibold text-ink">Shartnoma maydonlari</p>
          <div className="flex flex-col gap-1.5">
            {TEMPLATE_FIELDS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => insertField(f)}
                className="rounded-lg bg-canvas px-3 py-1.5 text-left text-sm text-ink-muted transition-colors hover:bg-line hover:text-ink"
              >
                {f}
              </button>
            ))}
          </div>
        </aside>
      </div>

      <FormError message={error} />
    </form>
  );
}
