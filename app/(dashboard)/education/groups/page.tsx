import { requirePermission } from "@/lib/auth/session";
import {
  GroupsTable,
  GROUP_SELECT,
  type GroupRow,
  type GroupSchedule,
} from "@/components/groups/GroupsTable";
import { NewGroupButton } from "@/components/groups/NewGroupButton";
import { InlineFilters, TablePager, type InlineField } from "@/components/ui/ListToolbar";
import { readPaging } from "@/lib/paging";
import { termsFor, type Segment } from "@/lib/segment";
import { HAFTA_KUNLARI, timeToMinutes } from "@/lib/utils/date";

/** Toq kunlar: Du, Chor, Ju; juft kunlar: Se, Pa, Sha (o'zbek o'quv markazlaridagi odat). */
const ODD_DAYS = ["Dushanba", "Chorshanba", "Juma"];
const EVEN_DAYS = ["Seshanba", "Payshanba", "Shanba"];

interface LessonSlot {
  group_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

/**
 * Guruhning kun va vaqti: dars jadvali (lessons) to'ldirilgan bo'lsa shundan,
 * aks holda guruhning o'z maydonlaridan (dars jadvali sahifasidagi qoida bilan bir xil).
 */
function scheduleOf(group: GroupRow, lessons: LessonSlot[]): GroupSchedule {
  const own = lessons.filter((l) => l.group_id === group.id);
  if (own.length === 0) {
    return { days: group.schedule_days ?? [], start: group.start_time, end: group.end_time };
  }
  const days = [...new Set(own.map((l) => l.weekday))]
    .sort((a, b) => a - b)
    .map((w) => HAFTA_KUNLARI[w - 1]);
  return {
    days,
    start: own.map((l) => l.start_time).sort()[0],
    end: own.map((l) => l.end_time).sort().at(-1) ?? null,
  };
}

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, org, permissions } = await requirePermission("groups.view");

  const segment: Segment = org.type;
  const terms = termsFor(segment);
  const isCourseBased = segment === "markaz";

  const [groupsRes, lessonsRes, teachersRes, roomsRes, coursesRes] = await Promise.all([
    supabase.from("groups").select(GROUP_SELECT).order("created_at", { ascending: false }),
    supabase.from("lessons").select("group_id, weekday, start_time, end_time"),
    supabase.from("teachers").select("id, full_name").order("full_name"),
    supabase.from("rooms").select("id, name").order("name"),
    supabase.from("courses").select("id, name").order("name"),
  ]);

  const allGroups = (groupsRes.data ?? []) as unknown as GroupRow[];
  const lessons = (lessonsRes.data ?? []) as LessonSlot[];
  const schedules = Object.fromEntries(allGroups.map((g) => [g.id, scheduleOf(g, lessons)]));

  // Filtrlar (URL parametrlari). Holat berilmasa faqat aktiv guruhlar.
  const status = params.status ?? "active";
  const q = params.q?.trim().toLowerCase();
  const time = params.time ? timeToMinutes(params.time) : null;

  const filtered = allGroups.filter((g) => {
    const s = schedules[g.id];
    if (status !== "all" && (g.status ?? "active") !== status) return false;
    if (q && !`${g.name} ${g.course?.name ?? ""}`.toLowerCase().includes(q)) return false;
    if (params.teacher && g.teacher_id !== params.teacher) return false;
    if (params.course && g.course_id !== params.course) return false;
    if (params.level && g.level !== params.level) return false;
    if (params.room && g.room_id !== params.room) return false;
    if (params.day && !s.days.includes(params.day)) return false;
    if (params.parity) {
      const allowed = params.parity === "odd" ? ODD_DAYS : EVEN_DAYS;
      if (s.days.length === 0 || !s.days.every((d) => allowed.includes(d))) return false;
    }
    if (time !== null) {
      if (!s.start) return false;
      const start = timeToMinutes(s.start);
      const end = s.end ? timeToMinutes(s.end) : start + 1;
      if (time < start || time >= end) return false;
    }
    return true;
  });

  const { page, size } = readPaging(params);
  const pageCount = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pageCount);
  const offset = (current - 1) * size;
  const visible = filtered.slice(offset, offset + size);

  // Statistika: filtrdan o'tgan guruhlardagi o'quvchilar (arxivlanganlar hisobga olinmaydi).
  const members = filtered.flatMap((g) => g.students ?? []).filter((s) => s.status !== "archived");
  const frozen = members.filter((s) => s.status === "frozen").length;

  const levels = [...new Set(allGroups.map((g) => g.level).filter((l): l is string => !!l))].sort();

  const fields: InlineField[] = [
    { name: "q", label: "Qidiruv", type: "text" },
    {
      name: "status",
      label: "Holati",
      type: "select",
      defaultValue: "active",
      options: [
        { value: "active", label: "Aktiv" },
        { value: "waiting", label: "Kutilmoqda" },
        { value: "archived", label: "Arxiv" },
      ],
    },
    {
      name: "teacher",
      label: terms.teacher,
      type: "select",
      options: (teachersRes.data ?? []).map((t) => ({ value: t.id, label: t.full_name })),
    },
    ...(isCourseBased
      ? ([
          {
            name: "course",
            label: "Kurs",
            type: "select",
            options: (coursesRes.data ?? []).map((c) => ({ value: c.id, label: c.name })),
          },
          {
            name: "level",
            label: "Kurs darajasi",
            type: "select",
            options: levels.map((l) => ({ value: l, label: l })),
          },
        ] satisfies InlineField[])
      : []),
    {
      name: "room",
      label: "Xona",
      type: "select",
      options: (roomsRes.data ?? []).map((r) => ({ value: r.id, label: r.name })),
    },
    {
      name: "day",
      label: "Kun",
      type: "select",
      options: HAFTA_KUNLARI.map((d) => ({ value: d, label: d })),
    },
    {
      name: "parity",
      label: "Juft/toq kunlar",
      type: "select",
      options: [
        { value: "even", label: "Juft kunlar" },
        { value: "odd", label: "Toq kunlar" },
      ],
    },
    { name: "time", label: "Dars vaqti", type: "time" },
  ];

  return (
    <div className="space-y-3">
      <InlineFilters
        storageKey="groups"
        fields={fields}
        actions={permissions.includes("groups.manage") ? <NewGroupButton /> : undefined}
      />

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-ink-muted">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              Jami {terms.studentPlural.toLowerCase()} soni:{" "}
              <b className="text-ink">{members.length}</b>
            </span>
            <span>
              Muzlatilgan {terms.studentPlural.toLowerCase()} soni:{" "}
              <b className="text-ink">{frozen}</b>
            </span>
          </div>
          <span className="rounded-lg border border-line px-2.5 py-1">
            Umumiy soni <b className="ml-1 text-ink">{filtered.length}</b>
          </span>
        </div>

        <GroupsTable
          groups={visible}
          segment={segment}
          schedules={schedules}
          offset={offset}
          showPrice={permissions.includes("payments.manage")}
        />
        <TablePager total={filtered.length} page={current} size={size} />
      </div>
    </div>
  );
}
