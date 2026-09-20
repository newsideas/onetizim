import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { RequestStatusSelect } from "@/components/platform/RequestStatusSelect";
import { formatPhone } from "@/lib/auth/identity";
import { formatDate } from "@/lib/utils/date";

interface RequestRow {
  id: string;
  created_at: string;
  center_name: string;
  contact_name: string;
  phone: string;
  comment: string | null;
  status: string;
}

/** Rasmiy saytdan kelgan demo arizalar: bog'lanish va markaz ochish shu yerdan boshlanadi. */
export default async function PlatformRequestsPage() {
  const { supabase } = await requirePlatformAdmin();
  const { data, error } = await supabase
    .from("demo_requests")
    .select("id, created_at, center_name, contact_name, phone, comment, status")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as RequestRow[];
  const fresh = rows.filter((r) => r.status === "new").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Arizalar</h1>
        <p className="text-sm text-ink-muted">
          Rasmiy saytdagi demo arizalar — {rows.length} ta, shundan {fresh} tasi yangi.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Arizalar jadvali bazada topilmadi — 0067 migratsiyasini Supabase SQL Editor&apos;da ishga tushiring.
        </p>
      )}

      {error ? null : rows.length === 0 ? (
        <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
          Hali ariza yo&apos;q. Sayt orqali kelgan arizalar shu yerda ko&apos;rinadi.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas text-xs text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Sana</th>
                <th className="px-4 py-3 font-medium">Markaz</th>
                <th className="px-4 py-3 font-medium">Aloqa</th>
                <th className="px-4 py-3 font-medium">Izoh</th>
                <th className="px-4 py-3 font-medium">Holat</th>
                <th className="px-4 py-3 font-medium">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const prefill = new URLSearchParams({
                  requestId: r.id,
                  center: r.center_name,
                  director: r.contact_name,
                  phone: r.phone,
                });
                return (
                  <tr key={r.id} className="align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-ink">{r.center_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-ink">{r.contact_name}</div>
                      <a href={`tel:+${r.phone}`} className="text-brand-600 hover:underline">
                        {formatPhone(r.phone)}
                      </a>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-ink-muted">{r.comment ?? "—"}</td>
                    <td className="px-4 py-3">
                      <RequestStatusSelect requestId={r.id} status={r.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.status !== "opened" && (
                        <Link
                          href={`/admin/organizations/new?${prefill.toString()}`}
                          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
                        >
                          Markaz ochish
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
