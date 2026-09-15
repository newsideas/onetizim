import Link from "next/link";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CatalogManager, type CatalogItem } from "@/components/settings/CatalogManager";
import { termsFor } from "@/lib/segment";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [{ data: org }, { data: rooms }, { data: courses }] = await Promise.all([
    supabase.from("organizations").select("name, type").maybeSingle(),
    supabase.from("rooms").select("id, name").order("name"),
    supabase.from("courses").select("id, name").order("name"),
  ]);

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold text-ink">Sozlamalar</h1>

      <div className="space-y-3 rounded-xl border border-line p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-ink-faint">Tashkilot</span>
          <span className="text-ink">{org?.name ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-faint">Turi</span>
          <span className="text-ink">
            {termsFor(org?.type).label}
          </span>
        </div>
      </div>

      <Link
        href="/settings/telegram"
        className="flex items-center gap-3 rounded-xl border border-line p-4 transition-colors hover:bg-canvas"
      >
        <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
          <Send size={18} />
        </div>
        <div>
          <div className="text-sm font-medium text-ink">Telegram bot</div>
          <div className="text-xs text-ink-faint">
            Ota-onalar uchun ulash havolalari
          </div>
        </div>
      </Link>

      <div className="grid gap-4 md:grid-cols-2">
        <CatalogManager
          table="rooms"
          title="Xonalar"
          placeholder="Masalan: 205-xona"
          items={(rooms ?? []) as CatalogItem[]}
        />
        <CatalogManager
          table="courses"
          title="Kurslar / Fanlar"
          placeholder="Masalan: Matematika"
          items={(courses ?? []) as CatalogItem[]}
        />
      </div>
    </div>
  );
}
