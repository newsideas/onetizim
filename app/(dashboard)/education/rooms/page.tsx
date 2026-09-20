import { Inbox } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PageTabs } from "@/components/ui/PageTabs";
import { InlineFilters, TablePager } from "@/components/ui/ListToolbar";
import { readPaging } from "@/lib/paging";
import {
  NewRoomButton,
  RoomRowActions,
  type EquipmentRow,
} from "@/components/rooms/RoomManagement";
import {
  buildEntries,
  type LessonRow,
  type ScheduleEntry,
  type ScheduleGroup,
} from "@/components/schedule/schedule-entries";
import { formatSom } from "@/lib/utils/currency";
import { timeToMinutes } from "@/lib/utils/date";

const TH = "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase";

interface RoomQueryRow {
  id: string;
  name: string;
  capacity: number | null;
  note: string | null;
  responsible_id: string | null;
  responsible: { full_name: string } | null;
  room_equipment: {
    equipment_id: string;
    quantity: number;
    equipment: { unit_price: number } | null;
  }[];
}

/** Bandlik hisobi uchun haftalik sig'im: Du–Sha, 08:00–20:00. */
const WEEK_CAPACITY_HOURS = 6 * 12;

function entryMinutes(e: ScheduleEntry): number {
  if (!e.startTime) return 0;
  const start = timeToMinutes(e.startTime);
  return e.endTime ? Math.max(0, timeToMinutes(e.endTime) - start) : (e.durationMinutes ?? 60);
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const tab = params.tab === "analytics" ? "analytics" : "rooms";
  const { supabase, permissions } = await requirePermission("groups.view");
  const canManage = permissions.includes("groups.manage");

  const [roomsRes, teachersRes, equipmentRes, groupsRes, lessonsRes] = await Promise.all([
    supabase
      .from("rooms")
      .select(
        "id, name, capacity, note, responsible_id, responsible:teachers(full_name), " +
          "room_equipment(equipment_id, quantity, equipment(unit_price))",
      )
      .order("name"),
    supabase.from("teachers").select("id, full_name").order("full_name"),
    supabase.from("equipment").select("id, name, inventory_code, unit_price").order("name"),
    tab === "analytics"
      ? supabase
          .from("groups")
          .select(
            "id, name, schedule_days, start_time, end_time, lesson_duration_minutes, " +
              "teacher:teachers(full_name), room:rooms(id, name), course:courses(name)",
          )
      : Promise.resolve({ data: [] }),
    tab === "analytics"
      ? supabase
          .from("lessons")
          .select(
            "id, group_id, teacher_id, room_id, subject, weekday, start_time, end_time, " +
              "group:groups(name), teacher:teachers(full_name), room:rooms(id, name)",
          )
      : Promise.resolve({ data: [] }),
  ]);

  const q = params.q?.trim().toLowerCase();
  const rooms = ((roomsRes.data ?? []) as unknown as RoomQueryRow[]).filter(
    (r) => !q || r.name.toLowerCase().includes(q),
  );
  const staff = (teachersRes.data ?? []) as { id: string; full_name: string }[];
  const equipment: EquipmentRow[] = (equipmentRes.data ?? []).map((e) => ({
    id: e.id as string,
    name: e.name as string,
    inventoryCode: e.inventory_code as string,
    unitPrice: Number(e.unit_price),
  }));

  const tabs = (
    <PageTabs
      tabs={[
        { label: "Xonalar", href: "/education/rooms", active: tab === "rooms" },
        { label: "Analitika", href: "/education/rooms?tab=analytics", active: tab === "analytics" },
      ]}
    />
  );

  if (tab === "analytics") {
    const entries = buildEntries(
      (groupsRes.data ?? []) as unknown as ScheduleGroup[],
      (lessonsRes.data ?? []) as unknown as LessonRow[],
    );
    const rows = rooms.map((room) => {
      const own = entries.filter((e) => e.roomId === room.id);
      const hours = own.reduce((sum, e) => sum + entryMinutes(e), 0) / 60;
      return {
        room,
        lessons: own.length,
        hours,
        percent: Math.min(100, Math.round((hours / WEEK_CAPACITY_HOURS) * 100)),
      };
    });

    return (
      <div className="space-y-3">
        {tabs}
      {roomsRes.error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Bazada kerakli jadval yoki ustun topilmadi — 0042_group_module.sql migratsiyasini Supabase
          SQL Editor&apos;da ishga tushiring.
        </p>
      )}
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-canvas">
                <tr>
                  <th className={`${TH} w-12`}>№</th>
                  <th className={TH}>Xona</th>
                  <th className={TH}>Haftalik darslar</th>
                  <th className={TH}>Band soat</th>
                  <th className={TH}>Bandlik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-sm text-ink-faint">
                      Ma&apos;lumotlar topilmadi
                    </td>
                  </tr>
                ) : (
                  rows.map(({ room, lessons, hours, percent }, i) => (
                    <tr key={room.id} className="hover:bg-canvas">
                      <td className="px-4 py-3 text-ink-faint">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-ink">{room.name}</td>
                      <td className="px-4 py-3 text-ink-muted">{lessons}</td>
                      <td className="px-4 py-3 text-ink-muted">{Math.round(hours * 10) / 10}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-line">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-xs text-ink-muted">{percent}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-4 py-2.5 text-xs text-ink-faint">
            Bandlik haftasiga {WEEK_CAPACITY_HOURS} soatga (Du–Sha, 08:00–20:00) nisbatan hisoblanadi.
          </p>
        </div>
      </div>
    );
  }

  const { page, size } = readPaging(params);
  const current = Math.min(page, Math.max(1, Math.ceil(rooms.length / size)));
  const offset = (current - 1) * size;
  const visible = rooms.slice(offset, offset + size);

  return (
    <div className="space-y-3">
      {tabs}
      {roomsRes.error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Bazada kerakli jadval yoki ustun topilmadi — 0042_group_module.sql migratsiyasini Supabase
          SQL Editor&apos;da ishga tushiring.
        </p>
      )}
      <InlineFilters
        storageKey="rooms"
        configurable={false}
        actions={canManage ? <NewRoomButton staff={staff} /> : undefined}
        fields={[{ name: "q", label: "Qidirish", type: "text" }]}
      />

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex justify-end px-4 py-3">
          <span className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink-muted">
            Umumiy soni <b className="ml-1 text-ink">{rooms.length}</b>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas">
              <tr>
                <th className={`${TH} w-12`}>№</th>
                <th className={TH}>Sarlavha</th>
                <th className={TH}>O&apos;quvchi sig&apos;imi</th>
                <th className={TH}>Izoh</th>
                <th className={TH}>Jihozlar soni</th>
                <th className={TH}>Taxminiy qiymati</th>
                <th className={TH}>Mas&apos;ul shaxs</th>
                {canManage && <th className={TH}>Amallar</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="px-4 py-16 text-center">
                    <Inbox size={22} className="mx-auto mb-2 text-ink-faint" aria-hidden="true" />
                    <div className="text-sm font-medium text-ink-muted">Ma&apos;lumotlar topilmadi</div>
                    <div className="mt-0.5 text-xs text-ink-faint">
                      Ma&apos;lumotlar topilmadi. Filterni o&apos;zgartirib ko&apos;ring.
                    </div>
                  </td>
                </tr>
              ) : (
                visible.map((room, i) => {
                  const count = room.room_equipment.reduce((sum, r) => sum + r.quantity, 0);
                  const value = room.room_equipment.reduce(
                    (sum, r) => sum + r.quantity * Number(r.equipment?.unit_price ?? 0),
                    0,
                  );
                  const assigned = Object.fromEntries(
                    room.room_equipment.map((r) => [r.equipment_id, r.quantity]),
                  );
                  return (
                    <tr key={room.id} className="hover:bg-canvas">
                      <td className="px-4 py-3 text-ink-faint">{offset + i + 1}</td>
                      <td className="px-4 py-3 font-medium text-ink">{room.name}</td>
                      <td className="px-4 py-3 text-ink-muted">{room.capacity ?? "—"}</td>
                      <td className="max-w-xs truncate px-4 py-3 text-ink-muted">{room.note || "—"}</td>
                      <td className="px-4 py-3 text-ink-muted">{count}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{formatSom(value)}</td>
                      <td className="px-4 py-3 text-ink-muted">{room.responsible?.full_name ?? "—"}</td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <RoomRowActions
                            room={{
                              id: room.id,
                              name: room.name,
                              capacity: room.capacity,
                              note: room.note,
                              responsibleId: room.responsible_id,
                            }}
                            staff={staff}
                            equipment={equipment}
                            assigned={assigned}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <TablePager total={rooms.length} page={current} size={size} />
      </div>
    </div>
  );
}
