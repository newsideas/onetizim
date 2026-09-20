import Link from "next/link";
import { ExternalLink, Inbox } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { InlineFilters, TablePager, type InlineField } from "@/components/ui/ListToolbar";
import { readPaging } from "@/lib/paging";
import { termsFor } from "@/lib/segment";
import { REGIONS } from "@/lib/regions";

const TH = "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase";

interface Row {
  id: string;
  full_name: string;
  phone: string | null;
  region: string | null;
  district: string | null;
  address: string | null;
}

/**
 * O'quvchilar manzillari. O'quvchi kartasida koordinata saqlanmaydi, shuning
 * uchun manzillar ro'yxat ko'rinishida; har biri xaritada (OpenStreetMap) ochiladi.
 */
export default async function StudentAddressesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, org } = await requirePermission("students.view");
  const terms = termsFor(org.type);

  const { data } = await supabase
    .from("students")
    .select("id, full_name, phone, region, district, address")
    .neq("status", "archived")
    .order("full_name");

  const q = params.q?.trim().toLowerCase();
  const rows = ((data ?? []) as Row[]).filter((s) => {
    if (params.region && s.region !== params.region) return false;
    if (params.district && !(s.district ?? "").toLowerCase().includes(params.district.toLowerCase()))
      return false;
    if (q && !`${s.full_name} ${s.address ?? ""} ${s.district ?? ""}`.toLowerCase().includes(q))
      return false;
    return true;
  });
  const withAddress = rows.filter((s) => s.address || s.district || s.region).length;

  const { page, size } = readPaging(params);
  const current = Math.min(page, Math.max(1, Math.ceil(rows.length / size)));
  const offset = (current - 1) * size;
  const visible = rows.slice(offset, offset + size);

  const fields: InlineField[] = [
    { name: "q", label: "Qidiruv", type: "text" },
    {
      name: "region",
      label: "Viloyat",
      type: "select",
      options: REGIONS.map((r) => ({ value: r, label: r })),
    },
    { name: "district", label: "Tuman / Shahar", type: "text" },
  ];

  return (
    <div className="space-y-3">
      <InlineFilters storageKey="students-addresses" configurable={false} fields={fields} />

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-ink-muted">
          <span>
            Manzili kiritilgan: <b className="text-ink">{withAddress}</b> / {rows.length}
          </span>
          <span className="rounded-lg border border-line px-2.5 py-1">
            Umumiy soni <b className="ml-1 text-ink">{rows.length}</b>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas">
              <tr>
                <th className={`${TH} w-12`}>№</th>
                <th className={TH}>{terms.student} ismi</th>
                <th className={TH}>Telefon raqam</th>
                <th className={TH}>Viloyat</th>
                <th className={TH}>Tuman / Shahar</th>
                <th className={TH}>Manzil</th>
                <th className={TH}>Xarita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Inbox size={22} className="mx-auto mb-2 text-ink-faint" aria-hidden="true" />
                    <div className="text-sm font-medium text-ink-muted">Ma&apos;lumotlar topilmadi</div>
                    <div className="mt-0.5 text-xs text-ink-faint">
                      Ma&apos;lumotlar topilmadi. Filterni o&apos;zgartirib ko&apos;ring.
                    </div>
                  </td>
                </tr>
              ) : (
                visible.map((s, i) => {
                  const place = [s.address, s.district, s.region].filter(Boolean).join(", ");
                  return (
                    <tr key={s.id} className="hover:bg-canvas">
                      <td className="px-4 py-3 text-ink-faint">{offset + i + 1}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/education/students/${s.id}`}
                          className="font-medium text-ink hover:text-brand-600"
                        >
                          {s.full_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{s.phone || "—"}</td>
                      <td className="px-4 py-3 text-ink-muted">{s.region || "—"}</td>
                      <td className="px-4 py-3 text-ink-muted">{s.district || "—"}</td>
                      <td className="max-w-xs truncate px-4 py-3 text-ink-muted">{s.address || "—"}</td>
                      <td className="px-4 py-3">
                        {place ? (
                          <a
                            href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(place)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                          >
                            Xaritada <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <TablePager total={rows.length} page={current} size={size} />
      </div>
    </div>
  );
}
