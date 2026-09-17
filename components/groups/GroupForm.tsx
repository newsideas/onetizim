"use client";

import { unwrap } from "@/lib/actions/result";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  groupSchema,
  EDUCATION_TYPE_LABELS,
  type GroupInput,
} from "@/lib/validations/group";
import { createGroup, updateGroup } from "@/lib/actions/groups";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { FormError } from "@/components/ui/FormError";
import { HAFTA_KUNLARI } from "@/lib/utils/date";
import { useSegment } from "@/components/layout/SegmentProvider";

/**
 * Guruh formasi. `groupId` berilsa tahrirlash, berilmasa yangi guruh
 * yaratish rejimida ishlaydi.
 */
export function GroupForm({
  onSuccess,
  groupId,
  defaultValues,
}: {
  onSuccess: () => void;
  groupId?: string;
  defaultValues?: Partial<GroupInput>;
}) {
  const router = useRouter();
  const { segment, terms } = useSegment();
  const [serverError, setServerError] = useState<string | null>(null);

  // Dars vaqti, kunlari va kurs faqat o'quv markazlarda ma'noga ega:
  // maktabda jadval fan bo'yicha quriladi, bog'chada esa kun tartibi bor.
  const isCourseBased = segment === "markaz";
  const isEdit = Boolean(groupId);

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
      educationType: "offline",
      ...defaultValues,
    },
  });

  const selectedDays = watch("scheduleDays");

  function toggleDay(day: string) {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setValue("scheduleDays", next, { shouldValidate: true });
  }

  async function onSubmit(values: GroupInput) {
    setServerError(null);
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="name">{terms.group} nomi</Label>
        <Input
          id="name"
          placeholder={
            segment === "maktab"
              ? "1-A"
              : segment === "bogcha"
                ? "Kichik guruh"
                : "Matematika-1"
          }
          error={errors.name?.message}
          {...register("name")}
        />
        <FormError message={errors.name?.message} />
      </div>

      {isCourseBased && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="subject">Kurs / Fan</Label>
            <Input id="subject" placeholder="Matematika" {...register("subject")} />
          </div>
          <div>
            <Label htmlFor="educationType">Ta&apos;lim turi</Label>
            <Select id="educationType" {...register("educationType")}>
              {Object.entries(EDUCATION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="teacherName">{terms.teacher}</Label>
          <Input
            id="teacherName"
            placeholder="Aziz Karimov"
            {...register("teacherName")}
          />
        </div>
        <div>
          <Label htmlFor="room">Xona</Label>
          <Input id="room" placeholder="205-xona" {...register("room")} />
        </div>
      </div>

      {isCourseBased && (
        <div>
          <Label>Dars kunlari</Label>
          <div className="flex flex-wrap gap-2">
            {HAFTA_KUNLARI.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedDays.includes(day)
                    ? "bg-brand-600 text-white"
                    : "bg-canvas text-ink-muted hover:bg-line"
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
          <FormError message={errors.scheduleDays?.message} />
        </div>
      )}

      {isCourseBased && (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="startTime">Boshlanishi</Label>
            <Input id="startTime" type="time" {...register("startTime")} />
          </div>
          <div>
            <Label htmlFor="endTime">Tugashi</Label>
            <Input id="endTime" type="time" {...register("endTime")} />
          </div>
          <div>
            <Label htmlFor="lessonDurationMinutes">Davomiyligi (daq)</Label>
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
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="startDate">Boshlanish sanasi</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
        </div>
        <div>
          <Label htmlFor="endDate">Tugash sanasi</Label>
          <Input id="endDate" type="date" {...register("endDate")} />
        </div>
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

      <FormError message={serverError ?? undefined} />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting
          ? "Saqlanmoqda..."
          : isEdit
            ? "O'zgarishlarni saqlash"
            : `${terms.group}ni saqlash`}
      </Button>
    </form>
  );
}
