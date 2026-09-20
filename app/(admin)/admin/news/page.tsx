import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { NewsManager, type NewsItem } from "@/components/platform/NewsManager";

/** Rasmiy sayt yangiliklari: yozish, yashirish, o'chirish. */
export default async function PlatformNewsPage() {
  const { supabase } = await requirePlatformAdmin();
  const { data, error } = await supabase
    .from("site_news")
    .select("id, created_at, title, body, is_published")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Yangiliklar</h1>
        <p className="text-sm text-ink-muted">Rasmiy saytda oxirgi 3 ta e&apos;lon qilingan yangilik ko&apos;rinadi.</p>
      </div>
      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Yangiliklar jadvali bazada topilmadi — 0071 migratsiyasini Supabase SQL Editor&apos;da ishga tushiring.
        </p>
      )}
      <NewsManager items={(data ?? []) as NewsItem[]} />
    </div>
  );
}
