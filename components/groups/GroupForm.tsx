"use client";

import { unwrap } from "@/lib/actions/result";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  groupSchema,
  EDUCATION_TYPE_LABELS,
  GROUP_STATUS_LABELS,
  type GroupInput,
} from "@/lib/validations/group";
import { createGroup, updateGroup, type GroupFormOptions } from "@/lib/actions/groups";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { FormError } from "@/components/ui/FormError";
import { HAFTA_KUNLARI } from "@/lib/utils/date";
import { useSegment } from "@/components/layout/SegmentProvider";

const JUFT_KUNLAR = ["Dushanba", "Chorshanba", "Juma"];
const TOQ_KUNLAR = ["Seshanba", "Payshanba", "Shanba"];

type DayMode = "" | "juft" | "toq" | "boshqa";

const EMPTY_OPTIONS: GroupFormOptions = { courses: [], teachers: [], rooms: [] };

function sameDays(a: string[], b: string[]) {
  return a.length === b.length && b.every((d) => a.includes(d));
}

/** Saqlangan dars kunlaridan "Juft / Toq / Boshqa kunlar" rejimini aniqlaydi. */
function modeFor(days: string[] | undefined): DayMode {
  if (!days || days.length === 0) return "";
  if (sameDays(days, JUFT_KUNLAR)) return "juft";
  if (sameDays(days, TOQ_KUNLAR)) return "toq";
  return "boshqa";
}

/** Tanlovda joriy qiymat ro'yxatda bo'lmasa (eski erkin matn) ham ko'rinishi uchun. */
function withCurrent(list: string[], current: string | undefined) {
  return current && !list.includes(current) ? [current, ...list] : list;
}

/**
 * Guruh formasi — Edu tizimdagidek: Kurs tanlangach Dars kuni, vaqtlar, O'qituvchi va Ta'lim turi chiqadi.
 * Xona, davomiylik, kurs darajasi va oylik narx "Qo'shimcha sozlamalar" ostida. `groupId` berilsa
 * tahrirlash, berilmasa yangi guruh yaratish rejimida ishlaydi.
 */
export function GroupForm({
  onSuccess,
  groupId,
  defaultValues,
  options = EMPTY_OPTIONS,
}: {
  onSuccess: () => void;
  groupId?: string;
  defaultValues?: Partial<GroupInput>;
  options?: GroupFormOptions;
}) {
  const router = useRouter();
  const { terms } = useSegment();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = Boolean(groupId);

  const hasExtras = Boolean(
    defaultValues?.room ||
      defaultValues?.level ||
      defaultValues?.lessonDurationMinutes ||
      (defaultValues?.monthlyPrice ?? 0) > 0,
  );
  const [showExtras, setShowExtras] = useState(hasExtras);
  const [dayMode, setDayMode] = useState<DayMode>(modeFor(defaultValues?.scheduleDays));

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GroupInput>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      scheduleDays: [],
      monthlyPrice: 0,
      // Yangi guruhda Edu tizimdagidek "Tanlang" bilan boshlanadi (majburiy tanlov).
      educationType: isEdit ? "offline" : ("" as GroupInput["educationType"]),
      status: isEdit ? "active" : ("" as GroupInput["status"]),
      ...defaultValues,
    },
  });

  const selectedDays = watch("scheduleDays");
  const subject = watch("subject");

  function chooseMode(mode: DayMode) {
    setDayMode(mode);
    if (mode === "juft") setValue("scheduleDays", JUFT_KUNLAR, { shouldValidate: true });
    else if (mode === "toq") setValue("scheduleDays", TOQ_KUNLAR, { shouldValidate: true });
    else if (mode === "") setValue("scheduleDays", [], { shouldValidate: true });
  }

  function toggleDay(day: string) {
    const next = selectedDays.includes(day) ? selectedDays.filter((d) => d !== day) : [...selectedDays, day];
    setValue("scheduleDays", next, { shouldValidate: true });
  }

  async function onSubmit(values: GroupInput) {
    setServerError(null);
    if (!values.subject?.trim()) return setServerError("Kursni tanlang");
    if (dayMode === "" || values.scheduleDays.length === 0) return setServerError("Dars kunini tanlang");
    if (!values.teacherName?.trim()) return setServerError(`${terms.teacher}ni tanlang`);
    try {
      if (groupId) {
        unwrap(await updateGroup(groupId, values));
      } else {
        unwrap(await createGroup(values));
      }
      router.refresh();
      onSuccess();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    }
  }

  const req = <span className="ml-0.5 text-red-500">*</span>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <p className="text-xs text-ink-faint">* Zarurligini bildiradi</p>

      <div>
        <Label htmlFor="name">
          {terms.group} nomi{req}
        </Label>
        <Input id="name" error={errors.name?.message} {...register("name")} />
        <FormError message={errors.name?.message} />
      </div>

      <div>
        <Label htmlFor="status">
          {terms.group} holati{req}
        </Label>
        <Select id="status" error={errors.status?.message} {...register("status")}>
          <option value="">Tanlang</option>
          <option value="active">{GROUP_STATUS_LABELS.active}</option>
          <option value="waiting">{GROUP_STATUS_LABELS.waiting}</option>
          {defaultValues?.status === "archived" && <option value="archived">{GROUP_STATUS_LABELS.archived}</option>}
        </Select>
        <FormError message={errors.status?.message} />
      </div>

      <div>
        <Label htmlFor="subject">Kurs{req}</Label>
        <Select id="subject" {...register("subject")}>
          <option value="">Tanlang</option>
          {withCurrent(options.courses, defaultValues?.subject).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>

      {subject && (
        <>
          <div>
            <Label htmlFor="dayMode">Dars kunini tanlang{req}</Label>
            <Select id="dayMode" value={dayMode} onChange={(e) => chooseMode(e.target.value as DayMode)}>
              <option value="">Tanlang</option>
              <option value="juft">Juft kunlar</option>
              <option value="toq">Toq kunlar</option>
              <option value="boshqa">Boshqa kunlar</option>
            </Select>
            {dayMode === "boshqa" && (
              <div className="mt-2 flex flex-wrap gap-2">
                {HAFTA_KUNLARI.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedDays.includes(day) ? "bg-brand-600 text-white" : "bg-canvas text-ink-muted hover:bg-line"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="startTime">Boshlanish vaqti</Label>
            <Input id="startTime" type="time" {...register("startTime")} />
          </div>
          <div>
            <Label htmlFor="endTime">Tugash vaqti</Label>
            <Input id="endTime" type="time" {...register("endTime")} />
          </div>

          <div>
            <Label htmlFor="teacherName">
              {terms.teacher}
              {req}
            </Label>
            <Select id="teacherName" {...register("teacherName")}>
              <option value="">Tanlang</option>
              {withCurrent(options.teachers, defaultValues?.teacherName).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
        </>
      )}

      <div>
        <Label htmlFor="educationType">Ta&apos;lim turi{req}</Label>
        <Select id="educationType" error={errors.educationType?.message} {...register("educationType")}>
          <option value="">Tanlang</option>
          <option value="online">{EDUCATION_TYPE_LABELS.online}</option>
          <option value="offline">{EDUCATION_TYPE_LABELS.offline}</option>
        </Select>
        <FormError message={errors.educationType?.message} />
      </div>

      <div>
        <Label htmlFor="telegramUrl">Telegram guruh havolasi</Label>
        <Input id="telegramUrl" error={errors.telegramUrl?.message} {...register("telegramUrl")} />
        <FormError message={errors.telegramUrl?.message} />
      </div>

      <div>
        <Label htmlFor="startDate">Boshlanish sanasi</Label>
        <Input id="startDate" type="date" {...register("startDate")} />
      </div>
      <div>
        <Label htmlFor="endDate">Bitkazish sanasi</Label>
        <Input id="endDate" type="date" {...register("endDate")} />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={showExtras}
          onChange={(e) => setShowExtras(e.target.checked)}
          className="h-4 w-4 rounded border-line"
        />
        Qo&apos;shimcha sozlamalar
      </label>

      {showExtras && (
        <div className="space-y-3 rounded-lg bg-canvas p-3">
          <div>
            <Label htmlFor="room">Xona</Label>
            <Select id="room" {...register("room")}>
              <option value="">Tanlang</option>
              {withCurrent(options.rooms, defaultValues?.room).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="lessonDurationMinutes">Davomiyligi (daqiqa)</Label>
            <Input
              id="lessonDurationMinutes"
              type="number"
              min={1}
              step={5}
              placeholder="90"
              {...register("lessonDurationMinutes", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
          </div>
          <div>
            <Label htmlFor="level">Kurs darajasi</Label>
            <Input id="level" placeholder="Beginner" {...register("level")} />
          </div>
          <div>
            <Label htmlFor="monthlyPrice">Oylik narxi (so&apos;m)</Label>
            <Input
              id="monthlyPrice"
              type="number"
              min={0}
              step={1000}
              error={errors.monthlyPrice?.message}
              {...register("monthlyPrice", { valueAsNumber: true })}
            />
            <FormError message={errors.monthlyPrice?.message} />
          </div>
        </div>
      )}

      <FormError message={serverError ?? undefined} />

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onSuccess}>
          Orqaga
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </form>
  );
}
