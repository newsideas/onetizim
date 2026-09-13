"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { studentSchema, type StudentInput } from "@/lib/validations/student";
import { createStudent } from "@/lib/actions/students";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { FormError } from "@/components/ui/FormError";

export interface GroupOption {
  id: string;
  name: string;
}

export function StudentForm({
  groups,
  onSuccess,
}: {
  groups: GroupOption[];
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentInput>({ resolver: zodResolver(studentSchema) });

  async function onSubmit(values: StudentInput) {
    setServerError(null);
    try {
      await createStudent(values);
      router.refresh();
      onSuccess();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="fullName">Ism familiyasi</Label>
        <Input
          id="fullName"
          placeholder="Masalan: Dilnoza Yusupova"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <FormError message={errors.fullName?.message} />
      </div>

      <div>
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" type="tel" placeholder="+998 90 123 45 67" {...register("phone")} />
      </div>

      <div>
        <Label htmlFor="groupId">Guruh</Label>
        <Select id="groupId" error={errors.groupId?.message} {...register("groupId")}>
          <option value="">Tanlang...</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
        <FormError message={errors.groupId?.message} />
      </div>

      <FormError message={serverError ?? undefined} />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saqlanmoqda..." : "O'quvchini saqlash"}
      </Button>
    </form>
  );
}
