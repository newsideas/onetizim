import Link from "next/link";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CatalogManager, type CatalogItem } from "@/components/settings/CatalogManager";

export default async function SettingsPage() {
  const supabase = await createClient();

  const [{ data: org }, { data: rooms }, { data: courses }] = await Promise.all([
    supabase.from("organizations").select("name, type").maybeSingle(),
    supabase.from("rooms").select("id, name").order("name"),
    supabase.from("courses").select("id, name").order("name"),
  ]);

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold text-white">Sozlamalar</h1>

      <div className="space-y-3 rounded-xl border border-white/10 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-white/50">Tashkilot</span>
          <span className="text-white">{org?.name ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Turi</span>
          <span className="text-white">
            {org?.type === "maktab" ? "Xususiy maktab" : "To'garak / o'quv markaz"}
          </span>
        </div>
      </div>

      <Link
        href="/settings/telegram"
        className="flex items-center gap-3 rounded-xl border border-white/10 p-4 transition-colors hover:bg-white/5"
      >
        <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
          <Send size={18} />
        </div>
        <div>
          <div className="text-sm font-medium text-white">Telegram bot</div>
          <div className="text-xs text-white/50">
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
