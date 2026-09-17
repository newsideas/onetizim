"use client";

import { unwrap, type ActionResult } from "@/lib/actions/result";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import type { ReferenceConfig, RefField } from "@/lib/references";
import {
  createReferenceItem,
  deleteReferenceItem,
  updateReferenceItem,
} from "@/lib/actions/references";

export interface RefOption {
  id: string;
  label: string;
}

export type ReferenceRow = { id: string } & Record<string, unknown>;

/**
 * Bitta ma'lumotnoma uchun to'liq boshqaruv: qo'shish formasi + jadval,
 * qatorni joyida tahrirlash va o'chirish. `config` faqat ko'rinish
 * uchun — haqiqiy yozish `lib/actions/references.ts`da `key` bo'yicha
 * tekshiriladi.
 */
export function ReferenceManager({
  refKey,
  config,
  rows,
  /** ref: field.ref bo'lgan maydonlar uchun variantlar ro'yxati. */
  refOptions = {},
}: {
  refKey: string;
  config: ReferenceConfig;
  rows: ReferenceRow[];
  refOptions?: Record<string, RefOption[]>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function labelFor(field: RefField, value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";
    if (field.type === "boolean") return value ? "Ha" : "Yo'q";
    if (field.ref) {
      const opt = refOptions[field.ref]?.find((o) => o.id === value);
      return opt?.label ?? "—";
    }
    return String(value);
  }

  function submit(action: (formData: FormData) => Promise<ActionResult>, formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        unwrap(await action(formData));
        router.refresh();
        setAdding(false);
        setEditingId(null);
        formRef.current?.reset();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Ushbu yozuvni o'chirmoqchimisiz?")) return;
    setError(null);
    startTransition(async () => {
      try {
        unwrap(await deleteReferenceItem(refKey, id));
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "O'chirishda xatolik");
      }
    });
  }

  function renderField(field: RefField, defaultValue?: unknown) {
    const common =
      "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none";

    if (field.type === "boolean") {
      return (
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name={field.name}
            defaultChecked={Boolean(defaultValue)}
            className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500/20"
          />
          {field.label}
        </label>
      );
    }

    if (field.type === "select" || field.ref) {
      const options = field.ref ? (refOptions[field.ref] ?? []) : [];
      return (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">
            {field.label}
            {field.required && <span className="text-red-500"> *</span>}
          </label>
          <select
            name={field.name}
            defaultValue={defaultValue ? String(defaultValue) : ""}
            required={field.required}
            className={common}
          >
            <option value="">Tanlang</option>
            {field.ref
              ? options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))
              : field.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
          </select>
        </div>
      );
    }

    return (
      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-muted">
          {field.label}
          {field.required && <span className="text-red-500"> *</span>}
        </label>
        <input
          type={field.type === "number" ? "number" : field.type}
          name={field.name}
          defaultValue={defaultValue ? String(defaultValue) : ""}
          required={field.required}
          className={common}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <FormError message={error} />}

      {adding ? (
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            submit((fd) => createReferenceItem(refKey, fd), new FormData(e.currentTarget));
          }}
          className="rounded-xl border border-line bg-surface p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {config.fields.map((field) => (
              <div key={field.name}>{renderField(field)}</div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setAdding(false)}>
              Bekor qilish
            </Button>
          </div>
        </form>
      ) : (
        <Button onClick={() => setAdding(true)} className="inline-flex items-center gap-2">
          <Plus size={16} /> Qo&apos;shish
        </Button>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas">
              <tr>
                <th className="w-12 px-4 py-3 text-xs font-semibold text-ink-muted">#</th>
                {config.fields.map((f) => (
                  <th
                    key={f.name}
                    className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase"
                  >
                    {f.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={config.fields.length + 2}
                    className="px-4 py-12 text-center text-ink-faint"
                  >
                    Hech qanday ma&apos;lumot topilmadi
                  </td>
                </tr>
              ) : (
                rows.map((row, i) =>
                  editingId === row.id ? (
                    <tr key={row.id} className="bg-canvas">
                      <td colSpan={config.fields.length + 2} className="p-3">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            submit(
                              (fd) => updateReferenceItem(refKey, row.id, fd),
                              new FormData(e.currentTarget),
                            );
                          }}
                        >
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {config.fields.map((field) => (
                              <div key={field.name}>
                                {renderField(field, row[field.name])}
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button type="submit" disabled={isPending}>
                              {isPending ? "Saqlanmoqda..." : "Saqlash"}
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setEditingId(null)}
                            >
                              <X size={15} />
                            </Button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={row.id} className="hover:bg-canvas">
                      <td className="px-4 py-3 text-ink-faint">{i + 1}</td>
                      {config.fields.map((field) => (
                        <td key={field.name} className="px-4 py-3 text-ink">
                          {labelFor(field, row[field.name])}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(row.id)}
                            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-canvas hover:text-ink"
                            aria-label="Tahrirlash"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id)}
                            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-red-50 hover:text-red-600"
                            aria-label="O'chirish"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-line px-4 py-2.5 text-xs text-ink-faint">
          {rows.length === 0 ? "0-0" : `1-${rows.length}`} / Jami: {rows.length}
        </div>
      </div>
    </div>
  );
}
