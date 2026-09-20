import { HAFTA_KUNLARI, todayIso } from "@/lib/utils/date";

/** Guruhning tugash sanasi o'tib ketgan bo'lsa — guruh tugagan. */
function isEnded(endDate: string | null | undefined): boolean {
  return !!endDate && endDate < todayIso();
}

export interface ScheduleGroup {
  id: string;
  name: string;
  course: { name: string } | null;
  room: { id: string; name: string } | null;
  lesson_duration_minutes: number | null;
  schedule_days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  /** Bosh sahifadagi "Holati" filtri uchun (ixtiyoriy). */
  end_date?: string | null;
  teacher: { full_name: string } | null;
}

export interface LessonRow {
  id: string;
  group_id: string;
  teacher_id: string | null;
  room_id: string | null;
  subject: string;
  weekday: number;
  start_time: string;
  end_time: string;
  group: { name: string; end_date?: string | null } | null;
  teacher: { full_name: string } | null;
  room: { id: string; name: string } | null;
}

/** Tahrirlash oynasini to'ldirish uchun lessons qatori. */
export interface EditableLesson {
  id: string;
  groupId: string;
  subject: string;
  teacherId: string | null;
  roomId: string | null;
  weekday: number;
  startTime: string;
  endTime: string;
}

/** Jadval kataklarida ko'rsatiladigan bitta dars (guruhdan yoki lessons jadvalidan). */
export interface ScheduleEntry {
  key: string;
  day: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  title: string;
  subtitle: string | null;
  teacher: string | null;
  roomId: string | null;
  roomName: string | null;
  /** Bosh sahifa filtrlari uchun: guruh nomi, kurs/fan va guruh tugagan-tugamagani. */
  groupName: string | null;
  courseName: string | null;
  groupEnded: boolean;
  /** Faqat lessons jadvalidagi yozuvlarni tahrirlash/o'chirish mumkin. */
  lesson: EditableLesson | null;
}

/**
 * Jadval ikki manbadan yig'iladi: lessons jadvali (fan bo'yicha aniq darslar)
 * va guruhning o'zidagi kun/vaqt. Darsi bor sinf uchun guruh maydonlari
 * ishlatilmaydi — aks holda bir dars ikki marta chiqib qolardi.
 */
export function buildEntries(groups: ScheduleGroup[], lessons: LessonRow[]): ScheduleEntry[] {
  const groupsWithLessons = new Set(lessons.map((l) => l.group_id));

  const fromLessons: ScheduleEntry[] = lessons.map((l) => ({
    key: `lesson-${l.id}`,
    day: HAFTA_KUNLARI[l.weekday - 1],
    startTime: l.start_time,
    endTime: l.end_time,
    durationMinutes: null,
    title: l.subject,
    subtitle: l.group?.name ?? null,
    teacher: l.teacher?.full_name ?? null,
    roomId: l.room?.id ?? null,
    roomName: l.room?.name ?? null,
    groupName: l.group?.name ?? null,
    courseName: l.subject,
    groupEnded: isEnded(l.group?.end_date),
    lesson: {
      id: l.id,
      groupId: l.group_id,
      subject: l.subject,
      teacherId: l.teacher_id,
      roomId: l.room_id,
      weekday: l.weekday,
      startTime: l.start_time,
      endTime: l.end_time,
    },
  }));

  const fromGroups: ScheduleEntry[] = groups
    .filter((g) => !groupsWithLessons.has(g.id))
    .flatMap((g) =>
      (g.schedule_days ?? []).map((day) => ({
        key: `group-${g.id}-${day}`,
        day,
        startTime: g.start_time,
        endTime: g.end_time,
        durationMinutes: g.lesson_duration_minutes,
        title: g.name,
        subtitle: g.course?.name ?? null,
        teacher: g.teacher?.full_name ?? null,
        roomId: g.room?.id ?? null,
        roomName: g.room?.name ?? null,
        groupName: g.name,
        courseName: g.course?.name ?? null,
        groupEnded: isEnded(g.end_date),
        lesson: null,
      })),
    );

  return [...fromLessons, ...fromGroups];
}
