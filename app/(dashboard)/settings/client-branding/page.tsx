import Link from "next/link";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/supabase/getCurrentOrg";
import { ListPageShell } from "@/components/ui/ListPage";
import { termsFor } from "@/lib/segment";
import { formatDate } from "@/lib/utils/date";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-ink-faint">{label}</span>
      <span className="text-right text-ink">{value}</span>
    </div>
  );
}

export default async function ClientBrandingPage() {
  const supabase = await createClient();
  const org = await getCurrentOrg(supabase);

  const director = [org.director_last_name, org.director_first_name]
    .filter(Boolean)
    .join(" ");

  return (
    <ListPageShell
      title="Muassasa ma'lumotlari"
      subtitle="Rasmiy rekvizitlar va obuna"
    >
      <div className="grid max-w-4xl gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-4 text-sm">
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Muassasa
          </h2>
          <Row label="Nomi" value={org.name || "—"} />
          <Row label="Turi" value={termsFor(org.type).label} />
          <Row label="STIR" value={org.tin || "—"} />
          <Row label="Viloyat" value={org.region || "—"} />
          <Row label="Tuman" value={org.district || "—"} />
          <Row label="Manzil" value={org.address || "—"} />
        </div>

        <div className="rounded-xl border border-line bg-surface p-4 text-sm">
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Rahbar va obuna
          </h2>
          <Row label="Rahbar" value={director || "—"} />
          <Row label="Telefon" value={org.phone || "—"} />
          <Row
            label="Tarif"
            value={org.plan === "trial" ? "Sinov muddati" : (org.plan ?? "—")}
          />
          <Row
            label="Obuna tugashi"
            value={org.trial_ends_at ? formatDate(org.trial_ends_at) : "—"}
          />
        </div>
      </div>

      <Link
        href="/settings/telegram"
        className="flex max-w-4xl items-center gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:bg-canvas"
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
    </ListPageShell>
  );
}
