"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  paymentSchema,
  METHOD_LABELS,
  type PaymentInput,
} from "@/lib/validations/payment";
import { createPayment } from "@/lib/actions/payments";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { FormError } from "@/components/ui/FormError";

export interface StudentOption {
  id: string;
  full_name: string;
}


function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentForm({
  students,
  onSuccess,
}: {
  students: StudentOption[];
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { paidAt: todayIso(), method: "naqd" },
  });

  async function onSubmit(values: PaymentInput) {
    setServerError(null);
    try {
      await createPayment(values);
      router.refresh();
      onSuccess();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="studentId">O&apos;quvchi</Label>
        <Select id="studentId" error={errors.studentId?.message} {...register("studentId")}>
          <option value="">Tanlang...</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </Select>
        <FormError message={errors.studentId?.message} />
      </div>

      <div>
        <Label htmlFor="amount">Summa (so&apos;m)</Label>
        <Input
          id="amount"
          type="number"
          min={0}
          step={1000}
          error={errors.amount?.message}
          {...register("amount", { valueAsNumber: true })}
        />
        <FormError message={errors.amount?.message} />
      </div>

      <div>
        <Label htmlFor="method">To&apos;lov usuli</Label>
        <Select id="method" error={errors.method?.message} {...register("method")}>
          {Object.entries(METHOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <FormError message={errors.method?.message} />
      </div>

      <div>
        <Label htmlFor="paidAt">Sana</Label>
        <Input
          id="paidAt"
          type="date"
          error={errors.paidAt?.message}
          {...register("paidAt")}
        />
        <FormError message={errors.paidAt?.message} />
      </div>

      <div>
        <Label htmlFor="note">Izoh (ixtiyoriy)</Label>
        <Input id="note" placeholder="Masalan: sentyabr oyi uchun" {...register("note")} />
      </div>

      <FormError message={serverError ?? undefined} />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saqlanmoqda..." : "To'lovni saqlash"}
      </Button>
    </form>
  );
}
