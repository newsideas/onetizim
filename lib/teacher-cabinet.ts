import type { SupabaseClient } from "@supabase/supabase-js";
import { HAFTA_KUNLARI, bugungiKun, todayIso } from "@/lib/utils/date";

export interface TeacherLessonRow {
  key: string;
  groupId: string;
  groupName: string;
  subject: string;
  startTime: string | null;
  endTime: string | null;
  roomName: string | null;
  /** 1 = Dushanba ... 7 = Yakshanba */
  weekday: number;
}

export interface TeacherGroupRow {
  id: string;
  name: string;
  studentCount: number;
}

export interface TeacherHomeworkRow {
  id: string;
  groupName: string;
  subject: string;
  title: string;
  dueOn: string;
}

export interface CabinetData {
  teacher: { id: string; full_name: string; position: string | null } | null;
  todayLessons: (TeacherLessonRow & { attendanceMarked: boolean })[];
  weekLessons: TeacherLessonRow[];
  groups: TeacherGroupRow[];
  homework: TeacherHomeworkRow[];
}

interface LessonQueryRow {
  id: string;
  group_id: string;
  subject: string;
  weekday: number;
  start_time: string;
  end_time: string;
  group: { name: string } | null;
  room: { name: string } | null;
}

interface GroupQueryRow {
  id: string;
  name: string;
  schedule_days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  room: { name: string } | null;
  students: { id: string }[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined): value is string {
  return !!value && UUID.test(value);
}

/**
 * Bitta o'qituvchining kabineti uchun hamma narsa: bugungi va haftalik
 * darslar, sinflari, yaqin uy vazifalari. Faqat shu o'qituvchining
 * ma'lumoti olinadi (teacher_id bo'yicha) — RLS esa ustiga yana himoya qo'yadi.
 */
export async function getCabinetData(
  supabase: SupabaseClient,
  teacherId: string,
): Promise<CabinetData> {
  const today = todayIso();
  const kun = bugungiKun();
  const weekday = (HAFTA_KUNLARI as readonly string[]).indexOf(kun) + 1;

  const [{ data: teacher }, { data: lessonData }] = await Promise.all([
    supabase.from("teachers").select("id, full_name, position").eq("id", teacherId).maybeSingle(),
    supabase
      .from("lessons")
      .select("id, group_id, subject, weekday, start_time, end_time, group:groups(name), room:rooms(name)")
      .eq("teacher_id", teacherId)
      .order("start_time"),
  ]);

  const lessons = (lessonData ?? []) as unknown as LessonQueryRow[];
  const lessonGroupIds = [...new Set(lessons.map((l) => l.group_id))];

  // Sinf rahbari bo'lgan sinflar + darsi bor sinflar.
  const groupFilter = [
    `teacher_id.eq.${teacherId}`,
    ...(lessonGroupIds.length ? [`id.in.(${lessonGroupIds.join(",")})`] : []),
  ].join(",");
  const { data: groupData } = await supabase
    .from("groups")
    .select("id, name, schedule_days, start_time, end_time, room:rooms(name), students(id)")
    .or(groupFilter)
    .order("name");
  const groups = (groupData ?? []) as unknown as GroupQueryRow[];
  const groupIds = groups.map((g) => g.id);

  // Darsi lessons jadvalida yo'q sinflar uchun eski kun/vaqt maydoni ishlatiladi.
  const groupsWithLessons = new Set(lessonGroupIds);
  const legacy: TeacherLessonRow[] = groups
    .filter((g) => !groupsWithLessons.has(g.id))
    .flatMap((g) =>
      (g.schedule_days ?? []).map((day) => ({
        key: `group-${g.id}-${day}`,
        groupId: g.id,
        groupName: g.name,
        subject: g.name,
        startTime: g.start_time,
        endTime: g.end_time,
        roomName: g.room?.name ?? null,
        weekday: (HAFTA_KUNLARI as readonly string[]).indexOf(day) + 1,
      })),
    )
    .filter((l) => l.weekday > 0);

  const weekLessons: TeacherLessonRow[] = [
    ...lessons.map((l) => ({
      key: `lesson-${l.id}`,
      groupId: l.group_id,
      groupName: l.group?.name ?? "—",
      subject: l.subject,
      startTime: l.start_time,
      endTime: l.end_time,
      roomName: l.room?.name ?? null,
      weekday: l.weekday,
    })),
    ...legacy,
  ].sort((a, b) => a.weekday - b.weekday || (a.startTime ?? "99").localeCompare(b.startTime ?? "99"));

  const todayGroupIds = [...new Set(weekLessons.filter((l) => l.weekday === weekday).map((l) => l.groupId))];

  const [{ data: attendanceRows }, { data: homeworkRows }] = await Promise.all([
    todayGroupIds.length
      ? supabase.from("attendance").select("group_id").eq("lesson_date", today).in("group_id", todayGroupIds)
      : Promise.resolve({ data: [] as { group_id: string }[] }),
    groupIds.length
      ? supabase
          .from("homework")
          .select("id, subject, title, due_on, group:groups(name)")
          .in("group_id", groupIds)
          .gte("due_on", today)
          .order("due_on")
          .limit(6)
      : Promise.resolve({ data: [] }),
  ]);

  const markedGroups = new Set((attendanceRows ?? []).map((r) => r.group_id as string));
  const homework = (
    (homeworkRows ?? []) as unknown as {
      id: string;
      subject: string;
      title: string;
      due_on: string;
      group: { name: string } | null;
    }[]
  ).map((h) => ({
    id: h.id,
    groupName: h.group?.name ?? "—",
    subject: h.subject,
    title: h.title,
    dueOn: h.due_on,
  }));

  return {
    teacher: teacher as CabinetData["teacher"],
    todayLessons: weekLessons
      .filter((l) => l.weekday === weekday)
      .map((l) => ({ ...l, attendanceMarked: markedGroups.has(l.groupId) })),
    weekLessons,
    groups: groups.map((g) => ({ id: g.id, name: g.name, studentCount: g.students?.length ?? 0 })),
    homework,
  };
}
