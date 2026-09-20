"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { createSiteNews, deleteSiteNews, setSiteNewsPublished } from "@/lib/actions/site-news";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useDialogs } from "@/components/ui/ConfirmDialog";
import { formatDate } from "@/lib/utils/date";

export interface NewsItem {
  id: string;
  created_at: string;
  title: string;
  body: string | null;
  is_published: boolean;
}

/** Rasmiy sayt yangiliklarini yozish, yashirish va o'chirish (super admin). */
export function NewsManager({ items }: { items: NewsItem[] }) {
  const router = useRouter();
  const { confirm, dialogs } = useDialogs();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string>();

  function add(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await createSiteNews({ title, body });
      if (!result.ok) return setError(result.error);
      setTitle("");
      setBody("");
      router.refresh();
    });
  }

  function toggle(item: NewsItem) {
    startTransition(async () => {
      const result = await setSiteNewsPublished(item.id, !item.is_published);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  async function remove(item: NewsItem) {
    if (!(await confirm(`"${item.title}" yangiligini o'chirmoqchimisiz?`, { danger: true, confirmLabel: "Ha, o'chirish" }))) return;
    startTransition(async () => {
      const result = await deleteSiteNews(item.id);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {dialogs}
      <form onSubmit={add} className="max-w-xl space-y-3 rounded-xl border border-line bg-surface p-5" noValidate>
        <div>
          <Label htmlFor="news-title">
            Sarlavha<span className="ml-0.5 text-red-500">*</span>
          </Label>
          <Input id="news-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="news-body">Matn</Label>
          <textarea
            id="news-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={2000}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
          />
        </div>
        <FormError message={error} />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saqlanmoqda..." : "E'lon qilish"}
        </Button>
      </form>

      {items.length === 0 ? (
        <div className="rounded-xl border border-line p-8 text-center text-ink-faint">Hali yangilik yo&apos;q.</div>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-ink">{item.title}</span>
                  {!item.is_published && (
                    <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] text-ink-faint">Yashirin</span>
                  )}
                </div>
                <div className="text-xs text-ink-faint">{formatDate(item.created_at)}</div>
                {item.body && <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{item.body}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  disabled={isPending}
                  aria-label={item.is_published ? "Saytdan yashirish" : "Saytda ko'rsatish"}
                  title={item.is_published ? "Saytdan yashirish" : "Saytda ko'rsatish"}
                  className="rounded-lg p-2 text-ink-faint hover:bg-canvas hover:text-ink disabled:opacity-40"
                >
                  {item.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => remove(item)}
                  disabled={isPending}
                  aria-label="O'chirish"
                  className="rounded-lg p-2 text-ink-faint hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
