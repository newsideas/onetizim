"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { groupSchema, type GroupInput } from "@/lib/validations/group";
import { createGroup } from "@/lib/actions/groups";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";
import { HAFTA_KUNLARI } from "@/lib/utils/date";

export function GroupForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GroupInput>({
    resolver: zodResolver(groupSchema),
    defaultValues: { scheduleDays: [], monthlyPrice: 0 },
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
      await createGroup(values);
      router.refresh();
      onSuccess();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="name">Guruh nomi</Label>
        <Input
          id="name"
          placeholder="Masalan: Matematika-1"
          error={errors.name?.message}
          {...register("name")}
        />
        <FormError message={errors.name?.message} />
      </div>

      <div>
        <Label htmlFor="subject">Fan</Label>
        <Input id="subject" placeholder="Masalan: Matematika" {...register("subject")} />
      </div>

      <div>
        <Label htmlFor="teacherName">O&apos;qituvchi</Label>
        <Input
          id="teacherName"
          placeholder="Masalan: Aziz Karimov"
          {...register("teacherName")}
        />
      </div>

      <div>
        <Label htmlFor="room">Xona</Label>
        <Input id="room" placeholder="Masalan: 205-xona" {...register("room")} />
      </div>

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
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
        <FormError message={errors.scheduleDays?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="startTime">Boshlanish vaqti</Label>
          <Input id="startTime" type="time" {...register("startTime")} />
        </div>
        <div>
          <Label htmlFor="endTime">Tugash vaqti</Label>
          <Input id="endTime" type="time" {...register("endTime")} />
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
        {isSubmitting ? "Saqlanmoqda..." : "Guruhni saqlash"}
      </Button>
    </form>
  );
}
