"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { createRole, updateRole } from "@/lib/actions/roles";
import { CATALOG_ACTIONS, PERMISSION_CATALOG, type CatalogResource } from "@/lib/permission-catalog";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export interface RoleEditorInitial {
  id: string;
  name: string;
  comment: string;
  bossOnly: boolean;
  actions: string[];
}

function ResourceCard({
  resource,
  granted,
  open,
  onToggleOpen,
  onToggleAction,
  onToggleAll,
}: {
  resource: CatalogResource;
  granted: Set<string>;
  open: boolean;
  onToggleOpen: () => void;
  onToggleAll: (checked: boolean) => void;
  onToggleAction: (key: string) => void;
}) {
  const count = resource.actions.filter((a) => granted.has(a.key)).length;
  const all = count === resource.actions.length;
  const some = count > 0 && !all;
  const single = resource.actions.length === 1 && resource.actions[0].label === resource.label;

  return (
    <div className="rounded-lg border border-line bg-canvas">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <input
          type="checkbox"
          checked={all}
          ref={(el) => {
            if (el) el.indeterminate = some;
          }}
          onChange={(e) => onToggleAll(e.target.checked)}
          aria-label={resource.label}
          className="h-4 w-4 shrink-0 rounded border-line accent-brand-600"
        />
        <button
          type="button"
          onClick={single ? () => onToggleAll(!all) : onToggleOpen}
          aria-expanded={single ? undefined : open}
          className="flex flex-1 items-center justify-between gap-2 text-left text-sm font-medium text-ink"
        >
          <span>{resource.label}</span>
          {!single && (
            <span className="flex items-center gap-1 text-xs text-ink-faint">
              {count > 0 && <span>{count}</span>}
              <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
            </span>
          )}
        </button>
      </div>
      {open && !single && (
        <div className="space-y-1.5 border-t border-line px-3 py-2.5">
          {resource.actions.map((action) => (
            <label key={action.key} className="flex cursor-pointer items-start gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={granted.has(action.key)}
                onChange={() => onToggleAction(action.key)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-brand-600"
              />
              {action.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/** Edu tizimdagi "Rol qo'shish / tahrirlash" sahifasi: nom, izoh va bo'limlar bo'yicha ruxsatlar. */
export function RoleEditor({ initial }: { initial: RoleEditorInitial | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initial?.name ?? "");
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [bossOnly, setBossOnly] = useState(initial?.bossOnly ?? false);
  const [granted, setGranted] = useState<Set<string>>(new Set(initial?.actions ?? []));
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const allKeys = useMemo(() => [...CATALOG_ACTIONS.keys()], []);
  const everything = granted.size >= allKeys.length;

  function setMany(keys: string[], checked: boolean) {
    setGranted((prev) => {
      const next = new Set(prev);
      for (const key of keys) {
        if (checked) next.add(key);
        else next.delete(key);
      }
      return next;
    });
  }

  function save() {
    setError(undefined);
    const input = { name, comment, bossOnly, actions: [...granted] };
    startTransition(async () => {
      const result = initial ? await updateRole(initial.id, input) : await createRole(input);
      if (!result.ok) return setError(result.error);
      router.push("/staff/roles");
      router.refresh();
    });
  }

  return (
    <div className="max-w-6xl space-y-5 rounded-xl border border-line bg-surface p-5">
      <div>
        <Label htmlFor="role-name">
          Ism<span className="ml-0.5 text-red-500">*</span>
        </Label>
        <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      </div>
      <div>
        <Label htmlFor="role-comment">Izoh</Label>
        <textarea
          id="role-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={200}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={bossOnly}
            onChange={(e) => setBossOnly(e.target.checked)}
            className="h-4 w-4 rounded border-line accent-brand-600"
          />
          Faqat boss ko&apos;ra oladi
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={everything}
            onChange={(e) => setMany(allKeys, e.target.checked)}
            className="h-4 w-4 rounded border-line accent-brand-600"
          />
          Hammasi
        </label>
      </div>

      {PERMISSION_CATALOG.map((section) => (
        <section key={section.title}>
          <h2 className="mb-2 border-b border-line pb-1 text-sm font-semibold text-ink-muted">{section.title}</h2>
          <div className="grid items-start gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {section.resources.map((resource) => (
              <ResourceCard
                key={resource.key}
                resource={resource}
                granted={granted}
                open={openKey === resource.key}
                onToggleOpen={() => setOpenKey((k) => (k === resource.key ? null : resource.key))}
                onToggleAll={(checked) =>
                  setMany(
                    resource.actions.map((a) => a.key),
                    checked,
                  )
                }
                onToggleAction={(key) => setMany([key], !granted.has(key))}
              />
            ))}
          </div>
        </section>
      ))}

      <FormError message={error} />

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Link
          href="/staff/roles"
          className="inline-flex items-center rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-canvas"
        >
          Orqaga
        </Link>
        <Button type="button" onClick={save} disabled={isPending}>
          {isPending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </div>
  );
}
