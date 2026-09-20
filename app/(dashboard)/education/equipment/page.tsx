import { Inbox } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { InlineFilters, TablePager } from "@/components/ui/ListToolbar";
import { readPaging } from "@/lib/paging";
import {
  EquipmentRowActions,
  NewEquipmentButton,
  type EquipmentRow,
} from "@/components/rooms/RoomManagement";
import { formatSom } from "@/lib/utils/currency";
import { formatDate, toIsoDay } from "@/lib/utils/date";

const TH = "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase";

interface EquipmentQueryRow {
  id: string;
  name: string;
  inventory_code: string;
  unit_price: number;
  created_at: string;
}

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, permissions } = await requirePermission("groups.view");
  const canManage = permissions.includes("groups.manage");

  const { data, error } = await supabase
    .from("equipment")
    .select("id, name, inventory_code, unit_price, created_at")
    .order("created_at", { ascending: false });

  const q = params.q?.trim().toLowerCase();
  const from = params.from ? Number(params.from) : null;
  const to = params.to ? Number(params.to) : null;

  const items = ((data ?? []) as EquipmentQueryRow[]).filter((e) => {
    if (q && !`${e.name} ${e.inventory_code}`.toLowerCase().includes(q)) return false;
    if (params.date && toIsoDay(e.created_at) !== params.date) return false;
    if (from !== null && Number.isFinite(from) && Number(e.unit_price) < from) return false;
    if (to !== null && Number.isFinite(to) && Number(e.unit_price) > to) return false;
    return true;
  });

  const { page, size } = readPaging(params);
  const current = Math.min(page, Math.max(1, Math.ceil(items.length / size)));
  const offset = (current - 1) * size;
  const visible = items.slice(offset, offset + size);

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Bazada kerakli jadval yoki ustun topilmadi — 0042_group_module.sql migratsiyasini Supabase
          SQL Editor&apos;da ishga tushiring.
        </p>
      )}
      <InlineFilters
        storageKey="equipment"
        configurable={false}
        actions={canManage ? <NewEquipmentButton /> : undefined}
        fields={[
          { name: "q", label: "Qidiruv", type: "text" },
          { name: "date", label: "Sana", type: "date" },
          { name: "from", label: "Dan", type: "number", width: "w-28" },
          { name: "to", label: "Gacha", type: "number", width: "w-28" },
        ]}
      />

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex justify-end px-4 py-3">
          <span className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink-muted">
            Umumiy soni <b className="ml-1 text-ink">{items.length}</b>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas">
              <tr>
                <th className={`${TH} w-12`}>№</th>
                <th className={TH}>Jihoz nomi</th>
                <th className={TH}>Inventar kodi</th>
                <th className={TH}>Narxi</th>
                <th className={TH}>Yaratilgan sana</th>
                {canManage && <th className={TH}>Amallar</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="px-4 py-16 text-center">
                    <Inbox size={22} className="mx-auto mb-2 text-ink-faint" aria-hidden="true" />
                    <div className="text-sm font-medium text-ink-muted">Ma&apos;lumotlar topilmadi</div>
                    <div className="mt-0.5 text-xs text-ink-faint">
                      Ma&apos;lumotlar topilmadi. Filterni o&apos;zgartirib ko&apos;ring.
                    </div>
                  </td>
                </tr>
              ) : (
                visible.map((item, i) => {
                  const row: EquipmentRow = {
                    id: item.id,
                    name: item.name,
                    inventoryCode: item.inventory_code,
                    unitPrice: Number(item.unit_price),
                  };
                  return (
                    <tr key={item.id} className="hover:bg-canvas">
                      <td className="px-4 py-3 text-ink-faint">{offset + i + 1}</td>
                      <td className="px-4 py-3 font-medium text-ink">{item.name}</td>
                      <td className="px-4 py-3 text-ink-muted">{item.inventory_code}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                        {formatSom(row.unitPrice)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                        {formatDate(item.created_at)}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <EquipmentRowActions item={row} />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <TablePager total={items.length} page={current} size={size} />
      </div>
    </div>
  );
}
