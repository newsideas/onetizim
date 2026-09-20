"use client";

import { unwrap, type ActionResult } from "@/lib/actions/result";
import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Inbox, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Drawer } from "@/components/ui/Drawer";
import { useDialogs } from "@/components/ui/ConfirmDialog";
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
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);
  const { confirm, dialogs } = useDialogs();

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

  async function handleDelete(id: string) {
    if (!(await confirm("Ushbu yozuvni o'chirmoqchimisiz?", { danger: true, confirmLabel: "O'chirish" }))) return;
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

    if (field.type === "color") {
      const hex = typeof defaultValue === "string" && /^#[0-9a-fA-F]{6}$/.test(defaultValue) ? defaultValue : "#000000";
      return (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">{field.label}</label>
          <input
            type="color"
            name={field.name}
            defaultValue={hex}
            className="h-10 w-full cursor-pointer rounded-lg border border-line bg-surface p-1"
          />
        </div>
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
        {field.type === "textarea" ? (
          <textarea
            name={field.name}
            defaultValue={defaultValue ? String(defaultValue) : ""}
            required={field.required}
            rows={3}
            className={common}
          />
        ) : (
          <input
            type={field.type === "number" ? "number" : field.type}
            name={field.name}
            defaultValue={defaultValue ? String(defaultValue) : ""}
            required={field.required}
            className={common}
          />
        )}
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) => config.fields.some((f) => labelFor(f, r[f.name]).toLowerCase().includes(q)))
    : rows;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const offset = (current - 1) * pageSize;
  const visible = filtered.slice(offset, offset + pageSize);

  const editing = editingId ? (rows.find((r) => r.id === editingId) ?? null) : null;
  const drawerOpen = adding || editing !== null;

  function closeDrawer() {
    setAdding(false);
    setEditingId(null);
    setError(null);
  }

  const th = "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase";

  return (
    <div className="space-y-3">
      {dialogs}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {config.formPage ? (
          <Link
            href={`${config.formPage}/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-brand-700"
          >
            <Plus size={15} aria-hidden="true" /> {config.addLabel ?? "Qo'shish"}
          </Link>
        ) : (
          <Button onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5">
            <Plus size={15} aria-hidden="true" /> {config.addLabel ?? "Qo'shish"}
          </Button>
        )}
        <input
          type="search"
          aria-label="Qidiruv"
          placeholder="Qidiruv"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="w-56 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink placeholder:text-ink-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
        />
      </div>

      {error && !drawerOpen && <FormError message={error} />}

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex justify-end px-4 py-3">
          <span className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink-muted">
            Umumiy soni <b className="ml-1 text-ink">{filtered.length}</b>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas">
              <tr>
                <th className={`${th} w-12`}>№</th>
                {config.fields.map((f) => (
                  <th key={f.name} className={th}>
                    {f.label}
                  </th>
                ))}
                <th className={th}>Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={config.fields.length + 2} className="px-4 py-16 text-center">
                    <Inbox size={22} className="mx-auto mb-2 text-ink-faint" aria-hidden="true" />
                    <div className="text-sm font-medium text-ink-muted">Ma&apos;lumotlar topilmadi</div>
                    <div className="mt-0.5 text-xs text-ink-faint">
                      Ma&apos;lumotlar topilmadi. Filterni o&apos;zgartirib ko&apos;ring.
                    </div>
                  </td>
                </tr>
              ) : (
                visible.map((row, i) => (
                  <tr key={row.id} className="hover:bg-canvas">
                    <td className="px-4 py-3 text-ink-faint">{offset + i + 1}</td>
                    {config.fields.map((field) => (
                      <td key={field.name} className="max-w-xs truncate px-4 py-3 text-ink-muted">
                        {labelFor(field, row[field.name])}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5">
                        {config.formPage ? (
                          <Link
                            href={`${config.formPage}/${row.id}`}
                            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-canvas hover:text-ink"
                            aria-label="Tahrirlash"
                            title="Tahrirlash"
                          >
                            <Pencil size={15} />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingId(row.id)}
                            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-canvas hover:text-ink"
                            aria-label="Tahrirlash"
                            title="Tahrirlash"
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label="O'chirish"
                          title="O'chirish"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-xs text-ink-muted">
          <span>
            {filtered.length === 0 ? 0 : offset + 1}-{Math.min(filtered.length, offset + pageSize)} / Jami:{" "}
            {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <select
              aria-label="Sahifadagi qatorlar soni"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} qator
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setPage(current - 1)}
              disabled={current <= 1}
              aria-label="Oldingi sahifa"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-line hover:bg-canvas disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="min-w-12 text-center text-ink">
              {current} / {pages}
            </span>
            <button
              type="button"
              onClick={() => setPage(current + 1)}
              disabled={current >= pages}
              aria-label="Keyingi sahifa"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-line hover:bg-canvas disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={
          config.itemTitle
            ? editing
              ? (config.editTitle ?? `${config.itemTitle}ni tahrirlash`)
              : `${config.itemTitle} qo'shish`
            : editing
              ? `${config.title} — tahrirlash`
              : `${config.title} — qo'shish`
        }
      >
        <form
          key={editing?.id ?? "new"}
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            if (editing) submit((data) => updateReferenceItem(refKey, editing.id, data), fd);
            else submit((data) => createReferenceItem(refKey, data), fd);
          }}
          className="flex h-full flex-col"
        >
          <div className="flex-1 space-y-4">
            {config.fields.map((field) => (
              <div key={field.name}>{renderField(field, editing?.[field.name])}</div>
            ))}
            {error && <FormError message={error} />}
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeDrawer}>
              Orqaga
            </Button>
            <Button type="submit" className="flex-[2]" disabled={isPending}>
              {isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
