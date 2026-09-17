"use client";

import { unwrap, type ActionResult } from "@/lib/actions/result";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import {
  createCatalogItem,
  renameCatalogItem,
  deleteCatalogItem,
} from "@/lib/actions/catalog";

export interface CatalogItem {
  id: string;
  name: string;
}

export function CatalogManager({
  table,
  title,
  placeholder,
  items,
}: {
  table: "rooms" | "courses";
  title: string;
  placeholder: string;
  items: CatalogItem[];
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /**
   * Server action'ni bajarib, ro'yxatni yangilaydi.
   *
   * Eslatma: router.refresh() ataylab startTransition ichida emas —
   * transition ichida chaqirilganda React uni kechiktirib yuboradi va
   * ro'yxat eski holatda qolib ketadi.
   */
  async function run(action: () => Promise<ActionResult | void>) {
    setError(null);
    setPending(true);
    try {
      const result = await action();
      if (result) unwrap(result);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setPending(false);
    }
  }

  function handleAdd() {
    if (!newName.trim()) return;
    run(async () => {
      unwrap(await createCatalogItem(table, newName));
      setNewName("");
    });
  }

  function handleRename(id: string) {
    run(async () => {
      unwrap(await renameCatalogItem(table, id, editingName));
      setEditingId(null);
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-line p-4">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleAdd();
        }}
      >
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={placeholder}
        />
        <Button type="submit" disabled={pending || !newName.trim()}>
          <Plus size={16} />
        </Button>
      </form>

      <FormError message={error ?? undefined} />

      {items.length === 0 ? (
        <p className="text-sm text-ink-faint">
          Hali qo&apos;shilmagan. Guruh yaratganda ham avtomatik qo&apos;shiladi.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 py-2">
              {editingId === item.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-8 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleRename(item.id)}
                    disabled={pending}
                    className="rounded-lg p-1.5 text-green-400 hover:bg-canvas"
                    aria-label="Saqlash"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg p-1.5 text-ink-faint hover:bg-canvas"
                    aria-label="Bekor qilish"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-ink">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditingName(item.name);
                    }}
                    className="rounded-lg p-1.5 text-ink-faint hover:bg-canvas hover:text-ink"
                    aria-label="Nomini o'zgartirish"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => run(() => deleteCatalogItem(table, item.id))}
                    disabled={pending}
                    className="rounded-lg p-1.5 text-ink-faint hover:bg-red-500/10 hover:text-red-400"
                    aria-label="O'chirish"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
