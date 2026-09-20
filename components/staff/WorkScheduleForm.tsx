"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveWorkSchedule } from "@/lib/actions/work-schedules";
import { unwrap } from "@/lib/actions/result";
import { referencePath } from "@/lib/references";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

export interface DayTimes {
  s?: string;
  e?: string;
  a?: string;
  bs?: string;
  be?: string;
}
export type Day = "off" | DayTimes;
export type DaysMap = Record<string, Day>;

const LIST_PATH = referencePath("work-schedules");
const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
const WEEKDAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
const FULL_WEEKDAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];

const pad = (n: number) => String(n).padStart(2, "0");
const isoDate = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
/** 0 = dushanba ... 6 = yakshanba */
const weekdayIndex = (y: number, m: number, d: number) => (new Date(Date.UTC(y, m, d)).getUTCDay() + 6) % 7;
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

interface Template {
  workDays: boolean[];
  times: Required<DayTimes>;
  from: string;
  to: string;
}

const DEFAULT_TEMPLATE: Template = {
  workDays: [true, true, true, true, true, false, false],
  times: { s: "09:00", e: "18:00", a: "", bs: "13:00", be: "14:00" },
  from: "",
  to: "",
};

/** Bo'sh vaqtlar olib tashlangan ish kuni yozuvi. */
function cleanTimes(t: DayTimes): DayTimes {
  return Object.fromEntries(Object.entries(t).filter(([, v]) => v)) as DayTimes;
}

/** Ish jadvali (Edu tizimdagidek): nom, yil, kod va har kun uchun ish vaqti yoki "Dam olish" kalendari. */
export function WorkScheduleForm({
  scheduleId,
  initial,
}: {
  scheduleId?: string;
  initial?: { name: string; year: number; code: string; days: DaysMap };
}) {
  const router = useRouter();
  const thisYear = new Date().getFullYear();
  const [name, setName] = useState(initial?.name ?? "");
  const [year, setYear] = useState(initial?.year ?? thisYear);
  const [code, setCode] = useState(initial?.code ?? "");
  const [days, setDays] = useState<DaysMap>(initial?.days ?? {});
  const [template, setTemplate] = useState<Template>(DEFAULT_TEMPLATE);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const yearOptions = useMemo(() => {
    const set = new Set([thisYear - 1, thisYear, thisYear + 1, thisYear + 2, year]);
    return [...set].sort((a, b) => a - b);
  }, [thisYear, year]);

  function toggleDay(date: string) {
    setDays((prev) => {
      const next = { ...prev };
      if (prev[date] === "off") next[date] = cleanTimes(template.times);
      else next[date] = "off";
      return next;
    });
  }

  /** Shablonni tanlangan sana oralig'iga (bo'sh bo'lsa butun yilga) qo'llaydi. */
  function applyTemplate() {
    const from = template.from || isoDate(year, 0, 1);
    const to = template.to || isoDate(year, 11, 31);
    if (from > to) return setError("Sana oralig'i noto'g'ri: boshlanish tugashdan keyin");
    setError(undefined);

    const next: DaysMap = { ...days };
    const cursor = new Date(`${from}T00:00:00Z`);
    const end = new Date(`${to}T00:00:00Z`);
    while (cursor <= end) {
      const y = cursor.getUTCFullYear();
      const m = cursor.getUTCMonth();
      const d = cursor.getUTCDate();
      next[isoDate(y, m, d)] = template.workDays[weekdayIndex(y, m, d)] ? cleanTimes(template.times) : "off";
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    setDays(next);
    setTemplateOpen(false);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSaving(true);
    try {
      unwrap(await saveWorkSchedule(scheduleId ?? null, { name, year, code, days }));
      router.push(LIST_PATH);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">{scheduleId ? "Ish jadvalini tahrirlash" : "Ish jadvali qo'shish"}</h2>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setTemplateOpen(true)}>
            Shablon bilan to&apos;ldirish
          </Button>
          <Link
            href={LIST_PATH}
            className="inline-flex items-center rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-muted hover:bg-canvas"
          >
            Orqaga
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-line bg-surface p-5 sm:grid-cols-3">
        <div>
          <Label htmlFor="ws-name">
            Nomi<span className="ml-0.5 text-red-500">*</span>
          </Label>
          <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="ws-year">Yil</Label>
          <Select id="ws-year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="ws-code">Kod</Label>
          <Input id="ws-code" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
      </div>

      <FormError message={error} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MONTHS.map((monthName, m) => {
          const offset = weekdayIndex(year, m, 1);
          const count = daysInMonth(year, m);
          return (
            <section key={monthName} className="rounded-xl border border-line bg-surface p-3">
              <h3 className="mb-2 text-sm font-semibold text-ink">
                {monthName} {year}
              </h3>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-ink-faint">
                {WEEKDAYS.map((w) => (
                  <span key={w} className="py-1 font-medium">
                    {w}
                  </span>
                ))}
                {Array.from({ length: offset }, (_, i) => (
                  <span key={`blank-${i}`} />
                ))}
                {Array.from({ length: count }, (_, i) => {
                  const date = isoDate(year, m, i + 1);
                  const day = days[date];
                  const off = day === "off";
                  const working = day && day !== "off";
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => toggleDay(date)}
                      title={off ? "Dam olish" : working ? `${(day as DayTimes).s ?? ""}–${(day as DayTimes).e ?? ""}` : "Belgilanmagan"}
                      className={`flex min-h-12 flex-col items-center justify-center rounded-lg border px-0.5 py-1 leading-tight transition-colors ${
                        off
                          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                          : working
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "border-line text-ink-muted hover:bg-canvas"
                      }`}
                    >
                      <span className="text-xs font-medium">{i + 1}</span>
                      <span className="text-[9px]">
                        {off ? "Dam olish" : working ? `${(day as DayTimes).s ?? ""}` : "–"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <Modal open={templateOpen} onClose={() => setTemplateOpen(false)} title="Shablon sozlamalari">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Ish kunlari</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {FULL_WEEKDAYS.map((label, i) => (
                <label key={label} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={template.workDays[i]}
                    onChange={(e) =>
                      setTemplate((t) => ({ ...t, workDays: t.workDays.map((v, idx) => (idx === i ? e.target.checked : v)) }))
                    }
                    className="h-4 w-4 rounded border-line accent-brand-600"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink">Vaqt sozlamalari</p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["s", "Boshlanish vaqti"],
                  ["e", "Tugash vaqti"],
                  ["a", "Kelish vaqti"],
                  ["bs", "Tanaffus boshlanishi"],
                  ["be", "Tanaffus tugashi"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <Label htmlFor={`tpl-${key}`}>{label}</Label>
                  <Input
                    id={`tpl-${key}`}
                    type="time"
                    value={template.times[key]}
                    onChange={(e) => setTemplate((t) => ({ ...t, times: { ...t.times, [key]: e.target.value } }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-ink">Sana oralig&apos;i</p>
            <p className="mb-2 text-xs text-ink-faint">Bo&apos;sh qoldirilsa butun yil uchun qo&apos;llaniladi</p>
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" aria-label="Boshlanish sanasi" value={template.from} onChange={(e) => setTemplate((t) => ({ ...t, from: e.target.value }))} />
              <Input type="date" aria-label="Tugash sanasi" value={template.to} onChange={(e) => setTemplate((t) => ({ ...t, to: e.target.value }))} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setTemplateOpen(false)}>
              Orqaga
            </Button>
            <Button type="button" onClick={applyTemplate}>
              Qo&apos;llash
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  );
}
