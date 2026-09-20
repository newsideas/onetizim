import { redirect } from "next/navigation";
import {
  Archive,
  Banknote,
  ListX,
  Snowflake,
  UserCheck,
  UserMinus,
  UserPlus,
  UserRound,
  UserRoundCheck,
  UserX,
  Users,
  Wallet,
} from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getHomeStats } from "@/lib/home";
import { termsFor } from "@/lib/segment";
import { StatCard } from "@/components/ui/StatCard";
import { HomeDashboard, type HomeOptions } from "@/components/home/HomeDashboard";
import {
  buildEntries,
  type LessonRow,
  type ScheduleGroup,
} from "@/components/schedule/schedule-entries";
import { bugungiKun } from "@/lib/utils/date";

const SCHEDULE_SELECT =
  "id, name, schedule_days, start_time, end_time, end_date, lesson_duration_minutes, " +
  "teacher:teachers(full_name), room:rooms(id, name), course:courses(name)";

const LESSON_SELECT =
  "id, group_id, teacher_id, room_id, subject, weekday, start_time, end_time, " +
  "group:groups(name, end_date), teacher:teachers(full_name), room:rooms(id, name)";

const NOTICE =
  "rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300";

export default async function DashboardPage() {
  const { supabase, org, role } = await requirePermission("dashboard.view");
  // O'qituvchi maktabning umumiy ko'rsatkichlarini emas, o'z kabinetini ko'radi.
  if (role === "teacher") redirect("/cabinet");

  const terms = termsFor(org.type);
  const student = terms.student.toLowerCase();

  const [stats, groupsRes, lessonsRes, teachersRes, roomsRes, coursesRes] = await Promise.all([
    getHomeStats(supabase),
    supabase.from("groups").select(SCHEDULE_SELECT).order("start_time", { nullsFirst: false }),
    supabase.from("lessons").select(LESSON_SELECT).order("start_time"),
    supabase.from("teachers").select("full_name").order("full_name"),
    supabase.from("rooms").select("id, name").order("name"),
    supabase.from("courses").select("name").order("name"),
  ]);

  // Supabase'ning TS inferi many-to-one join'ni massiv deb hisoblaydi, lekin
  // PostgREST yakka obyekt qaytaradi (education/schedule sahifasidagi kabi cast).
  const groups = (groupsRes.data ?? []) as unknown as ScheduleGroup[];
  const lessons = (lessonsRes.data ?? []) as unknown as LessonRow[];
  const entries = buildEntries(groups, lessons);

  const options: HomeOptions = {
    teachers: (teachersRes.data ?? []).map((t) => t.full_name as string),
    groups: groups.map((g) => g.name),
    rooms: (roomsRes.data ?? []) as { id: string; name: string }[],
    courses: (coursesRes.data ?? []).map((c) => c.name as string),
  };

  const studentsHref = "/education/students";

  const cards = [
    { label: "Buyurtmalar", value: stats.orders, icon: UserPlus, accent: "green", href: "/leads" },
    {
      label: "Birinchi darsga keladiganlar",
      value: stats.firstLesson,
      icon: UserRoundCheck,
      accent: "brand",
      href: "/leads",
    },
    {
      label: `Yangi ${terms.studentPlural.toLowerCase()}`,
      value: stats.newStudents,
      icon: UserRound,
      accent: "purple",
      href: studentsHref,
    },
    {
      label: `Aktiv ${terms.studentPlural.toLowerCase()}`,
      value: stats.activeStudents,
      icon: UserCheck,
      accent: "green",
      href: `${studentsHref}?status=active`,
    },
    {
      label: "Buyurtmadan ketganlar",
      value: stats.lostOrders,
      icon: ListX,
      accent: "red",
      href: "/leads",
    },
    {
      label: `Yangi ${student}dan ketganlar`,
      value: stats.leftNew,
      icon: UserMinus,
      accent: "red",
      href: `${studentsHref}?status=archived`,
    },
    {
      label: `Aktiv ${student}dan ketganlar`,
      value: stats.leftActive,
      icon: UserX,
      accent: "red",
      href: `${studentsHref}?status=archived`,
    },
    {
      label: "Qarzdorlar",
      value: stats.debtors,
      icon: Banknote,
      accent: "dark",
      href: "/finance/payments",
    },
    {
      label: terms.groupPlural,
      value: stats.groups,
      icon: Users,
      accent: "blue",
      href: "/education/groups",
    },
    {
      label: "Birinchi to'lovni qilganlar",
      value: stats.firstPayers,
      icon: Wallet,
      accent: "amber",
      href: "/finance/payments",
    },
    {
      label: "Muzlatilgan",
      value: stats.frozen,
      icon: Snowflake,
      accent: "blue",
      href: `${studentsHref}?status=frozen`,
    },
    {
      label: "Arxivlar",
      value: stats.archived,
      icon: Archive,
      accent: "gray",
      href: `${studentsHref}?status=archived`,
    },
  ] as const;

  const notices = (
    <>
      {lessonsRes.error && (
        <p className={NOTICE}>
          Darslar jadvali bazada topilmadi — 0028_lessons.sql migratsiyasini Supabase SQL
          Editor&apos;da ishga tushiring.
        </p>
      )}
      {stats.archiveDateMissing && (
        <p className={NOTICE}>
          «Ketganlar» kartalari uchun 0041_student_archived_at.sql migratsiyasini Supabase SQL
          Editor&apos;da ishga tushiring.
        </p>
      )}
    </>
  );

  return (
    <HomeDashboard
      title="Dars jadvali"
      today={bugungiKun()}
      entries={entries}
      options={options}
      statsNotice={notices}
      stats={
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {cards.map((c) => (
            <StatCard
              key={c.label}
              label={c.label}
              value={c.value}
              icon={c.icon}
              accent={c.accent}
              href={c.href}
            />
          ))}
        </div>
      }
    />
  );
}
