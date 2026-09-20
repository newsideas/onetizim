"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChartColumn,
  Download,
  DoorOpen,
  Funnel,
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
  Settings2,
  UserRound,
} from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { Select } from "@/components/ui/Select";
import type { ScheduleEntry } from "@/components/schedule/schedule-entries";
import {
  HomeTimetable,
  type Column,
  type GroupBy,
  type TimetableView,
} from "@/components/home/HomeTimetable";
import { LessonActions } from "@/components/schedule/LessonActions";
import type { LessonOptions } from "@/components/schedule/LessonFormModal";
import { HAFTA_KUNLARI } from "@/lib/utils/date";

export interface HomeOptions {
  teachers: string[];
  groups: string[];
  rooms: { id: string; name: string }[];
  courses: string[];
}

/** Edu tizimdagi tartib: haftaning birinchi kuni — Yakshanba. */
const DAY_TABS: { short: string; full: (typeof HAFTA_KUNLARI)[number] }[] = [
  { short: "Yak", full: "Yakshanba" },
  { short: "Du", full: "Dushanba" },
  { short: "Se", full: "Seshanba" },
  { short: "Chor", full: "Chorshanba" },
  { short: "Pa", full: "Payshanba" },
  { short: "Ju", full: "Juma" },
  { short: "Sha", full: "Shanba" },
];

const OUTLINE_BTN =
  "inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-surface px-3 py-1.5 text-xs font-medium text-brand-600 transition-colors duration-300 ease-(--ease-edu) hover:bg-brand-50";

interface Filters {
  teacher: string;
  group: string;
  room: string;
  course: string;
  status: "" | "active" | "ended";
}

const NO_FILTERS: Filters = {
  teacher: "",
  group: "",
  room: "",
  course: "",
  status: "",
};

function IconToggle({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`flex h-8 w-9 items-center justify-center rounded-md transition-colors duration-300 ease-(--ease-edu) ${
        active ? "bg-brand-600 text-white" : "text-ink-muted hover:bg-line"
      }`}
    >
      {children}
    </button>
  );
}

/** Excel to'g'ri o'qishi uchun BOM bilan CSV. */
function downloadCsv(entries: ScheduleEntry[]) {
  const dayIndex = (day: string) =>
    HAFTA_KUNLARI.indexOf(day as (typeof HAFTA_KUNLARI)[number]);
  const rows = [...entries]
    .sort(
      (a, b) =>
        dayIndex(a.day) - dayIndex(b.day) ||
        (a.startTime ?? "").localeCompare(b.startTime ?? ""),
    )
    .map((e) => [
      e.day,
      e.startTime?.slice(0, 5) ?? "",
      e.endTime?.slice(0, 5) ?? "",
      e.title,
      e.subtitle ?? "",
      e.teacher ?? "",
      e.roomName ?? "",
    ]);
  const header = [
    "Kun",
    "Boshlanishi",
    "Tugashi",
    "Dars",
    "Guruh / kurs",
    "O'qituvchi",
    "Xona",
  ];
  const csv = [header, ...rows]
    .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");

  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "dars-jadvali.csv";
  link.click();
  URL.revokeObjectURL(url);
}

const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;

export function HomeDashboard({
  title,
  stats,
  statsNotice,
  entries,
  options,
  today,
  lessonOptions,
  headerActions,
}: {
  /** Berilmasa sarlavha chizilmaydi (Dars jadvali sahifasi sarlavhasiz). */
  title?: string;
  /** Server'da chizilgan rangli kartalar to'ri. Berilmasa "Statistika" tugmasi ham chiqmaydi. */
  stats?: ReactNode;
  statsNotice?: ReactNode;
  entries: ScheduleEntry[];
  options: HomeOptions;
  /** Bugungi kunning to'liq nomi ("Dushanba") — server hisoblaydi (Toshkent vaqti). */
  today: string;
  /** Berilsa (direktor/administrator) dars bloklarida tahrirlash va o'chirish tugmalari chiqadi. */
  lessonOptions?: LessonOptions | null;
  /** Filtr tugmasi yonidagi qo'shimcha amallar (masalan "Dars qo'shish"). */
  headerActions?: ReactNode;
}) {
  const [showStats, setShowStats] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [day, setDay] = useState(today);
  const [groupBy, setGroupBy] = useState<GroupBy>("room");
  const [view, setView] = useState<TimetableView>("grid");
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(22);
  const [fullscreen, setFullscreen] = useState(false);

  // Katta holatdan Esc bilan chiqish.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const filtered = useMemo(
    () =>
      entries.filter(
        (e) =>
          (!filters.teacher || e.teacher === filters.teacher) &&
          (!filters.group || e.groupName === filters.group) &&
          (!filters.room || e.roomId === filters.room) &&
          (!filters.course || e.courseName === filters.course) &&
          (!filters.status || (filters.status === "ended") === e.groupEnded),
      ),
    [entries, filters],
  );
  const dayEntries = useMemo(
    () => filtered.filter((e) => e.day === day),
    [filtered, day],
  );

  // Filtr tanlangan bo'lsa faqat o'sha xona/o'qituvchi ustuni ko'rsatiladi.
  const columns: Column[] =
    groupBy === "room"
      ? options.rooms
          .filter((r) => !filters.room || r.id === filters.room)
          .map((r) => ({ key: r.id, name: r.name }))
      : options.teachers
          .filter((t) => !filters.teacher || t === filters.teacher)
          .map((t) => ({ key: t, name: t }));

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {title ? <h1 className="text-xl font-semibold text-ink">{title}</h1> : <span />}
        <div className="flex items-center gap-2">
          {headerActions}
          {stats && (
            <button
              type="button"
              onClick={() => setShowStats((v) => !v)}
              aria-pressed={showStats}
              className={OUTLINE_BTN}
            >
              <ChartColumn size={14} aria-hidden="true" />
              Statistika
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-pressed={showFilters}
            className={OUTLINE_BTN}
          >
            <Funnel size={14} aria-hidden="true" />
            Filtr
            {hasFilters && (
              <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
            )}
          </button>
        </div>
      </div>

      {statsNotice}
      {showStats && stats}

      {showFilters && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {hasFilters && (
            <button
              type="button"
              onClick={() => setFilters(NO_FILTERS)}
              className="mr-1 text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline"
            >
              Tozalash
            </button>
          )}
          <Select
            aria-label="O'qituvchi"
            className="!w-40 !py-2"
            value={filters.teacher}
            onChange={(e) => setFilter("teacher", e.target.value)}
          >
            <option value="">O&apos;qituvchi</option>
            {options.teachers.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Guruh"
            className="!w-40 !py-2"
            value={filters.group}
            onChange={(e) => setFilter("group", e.target.value)}
          >
            <option value="">Guruh</option>
            {options.groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Xona"
            className="!w-40 !py-2"
            value={filters.room}
            onChange={(e) => setFilter("room", e.target.value)}
          >
            <option value="">Xona</option>
            {options.rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Kurs"
            className="!w-40 !py-2"
            value={filters.course}
            onChange={(e) => setFilter("course", e.target.value)}
          >
            <option value="">Kurs</option>
            {options.courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Holati"
            className="!w-40 !py-2"
            value={filters.status}
            onChange={(e) =>
              setFilter("status", e.target.value as Filters["status"])
            }
          >
            <option value="">Holati</option>
            <option value="active">Faol</option>
            <option value="ended">Tugagan</option>
          </Select>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => downloadCsv(filtered)}
          className={OUTLINE_BTN}
        >
          <Download size={14} aria-hidden="true" />
          Export
        </button>
      </div>

      <section
        className={
          fullscreen
            ? "fixed inset-0 z-50 flex flex-col gap-3 bg-canvas p-4"
            : "flex flex-col gap-3 rounded-xl border border-line bg-surface p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            className="flex flex-wrap gap-1 rounded-lg bg-canvas p-1"
            role="tablist"
          >
            {DAY_TABS.map((d) => (
              <button
                key={d.full}
                type="button"
                role="tab"
                aria-selected={day === d.full}
                title={d.full}
                onClick={() => setDay(d.full)}
                className={`min-w-11 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-300 ease-(--ease-edu) ${
                  day === d.full
                    ? "bg-brand-600 text-white"
                    : "text-ink-muted hover:bg-line hover:text-ink"
                }`}
              >
                {d.short}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-canvas p-1">
              <IconToggle
                active={groupBy === "room"}
                label="Xonalar bo'yicha"
                onClick={() => setGroupBy("room")}
              >
                <DoorOpen size={16} />
              </IconToggle>
              <IconToggle
                active={groupBy === "teacher"}
                label="O'qituvchilar bo'yicha"
                onClick={() => setGroupBy("teacher")}
              >
                <UserRound size={16} />
              </IconToggle>
            </div>

            <div className="flex rounded-lg bg-canvas p-1">
              <IconToggle
                active={view === "grid"}
                label="Jadval ko'rinishi"
                onClick={() => setView("grid")}
              >
                <LayoutGrid size={16} />
              </IconToggle>
              <IconToggle
                active={view === "list"}
                label="Ro'yxat ko'rinishi"
                onClick={() => setView("list")}
              >
                <List size={16} />
              </IconToggle>
            </div>

            <Popover
              ariaLabel="Jadval ko'rinishi sozlamalari"
              triggerClassName="flex h-8 w-9 items-center justify-center rounded-md bg-canvas text-ink-muted transition-colors hover:bg-line"
              panelClassName="w-56 p-3"
              label={<Settings2 size={16} />}
            >
              <div className="space-y-3 text-sm">
                <div>
                  <label
                    className="mb-1 block text-xs text-ink-muted"
                    htmlFor="home-start-hour"
                  >
                    Boshlanish soati
                  </label>
                  <Select
                    id="home-start-hour"
                    className="!py-2"
                    value={startHour}
                    onChange={(e) =>
                      setStartHour(
                        Math.min(Number(e.target.value), endHour - 1),
                      )
                    }
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>
                        {hourLabel(h)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label
                    className="mb-1 block text-xs text-ink-muted"
                    htmlFor="home-end-hour"
                  >
                    Tugash soati
                  </label>
                  <Select
                    id="home-end-hour"
                    className="!py-2"
                    value={endHour}
                    onChange={(e) =>
                      setEndHour(
                        Math.max(Number(e.target.value), startHour + 1),
                      )
                    }
                  >
                    {Array.from({ length: 24 }, (_, h) => h + 1).map((h) => (
                      <option key={h} value={h}>
                        {hourLabel(h)}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </Popover>

            <button
              type="button"
              onClick={() => setFullscreen((v) => !v)}
              aria-label={
                fullscreen ? "Kichraytirish" : "Katta holatda ko'rish"
              }
              title={
                fullscreen ? "Kichraytirish (Esc)" : "Katta holatda ko'rish"
              }
              className="flex h-8 w-9 items-center justify-center rounded-md bg-canvas text-ink-muted transition-colors hover:bg-line"
            >
              {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        <div
          className={`overflow-auto rounded-lg border border-line ${
            fullscreen ? "min-h-0 flex-1" : "max-h-[calc(100vh-15rem)] min-h-96"
          }`}
        >
          <HomeTimetable
            entries={dayEntries}
            columns={columns}
            groupBy={groupBy}
            view={view}
            startHour={startHour}
            endHour={endHour}
            emptyText={`${day} kuni dars yo'q`}
            renderActions={
              lessonOptions
                ? (e) =>
                    e.lesson ? (
                      <LessonActions lesson={e.lesson} title={e.title} options={lessonOptions} />
                    ) : null
                : undefined
            }
          />
        </div>
      </section>
    </div>
  );
}
