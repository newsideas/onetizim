"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  studentSchema,
  GENDER_LABELS,
  RELATIONS,
  type StudentInput,
} from "@/lib/validations/student";
import { createStudent, updateStudent } from "@/lib/actions/students";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormError } from "@/components/ui/FormError";
import { FormSection, Field, FormActions } from "@/components/ui/FormLayout";
import { useSegment } from "@/components/layout/SegmentProvider";

export interface GroupOption {
  id: string;
  name: string;
}

/**
 * To'liq sahifali o'quvchi/bola formasi — bo'limlarga ajratilgan.
 * `studentId` berilsa tahrirlash rejimida ishlaydi.
 */
export function StudentForm({
  groups,
  studentId,
  defaultValues,
}: {
  groups: GroupOption[];
  studentId?: string;
  defaultValues?: Partial<StudentInput>;
}) {
  const router = useRouter();
  const { terms } = useSegment();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues,
  });

  async function onSubmit(values: StudentInput) {
    setServerError(null);
    try {
      if (studentId) {
        await updateStudent(studentId, values);
      } else {
        await createStudent(values);
      }
      router.push("/students");
      router.refresh();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <FormSection title={`${terms.student}ning shaxsiy ma'lumotlari`}>
        <Field label="Familiyasi" htmlFor="lastName" required error={errors.lastName?.message}>
          <Input id="lastName" placeholder="Kiriting" error={errors.lastName?.message} {...register("lastName")} />
        </Field>
        <Field label="Ism" htmlFor="firstName" required error={errors.firstName?.message}>
          <Input id="firstName" placeholder="Kiriting" error={errors.firstName?.message} {...register("firstName")} />
        </Field>
        <Field label="Otasining ismi" htmlFor="middleName">
          <Input id="middleName" placeholder="Kiriting" {...register("middleName")} />
        </Field>
        <Field label="Tug'ilgan sana" htmlFor="birthDate">
          <Input id="birthDate" type="date" {...register("birthDate")} />
        </Field>
        <Field label="Jinsi" htmlFor="gender">
          <Select id="gender" {...register("gender")}>
            <option value="">Tanlang</option>
            {Object.entries(GENDER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Millati" htmlFor="nationality">
          <Input id="nationality" placeholder="Kiriting" {...register("nationality")} />
        </Field>
      </FormSection>

      <FormSection title="Tug'ilganlik haqida guvohnoma ma'lumotlari">
        <Field label="Guvohnoma seriyasi" htmlFor="birthCertSeries">
          <Input id="birthCertSeries" placeholder="Kiriting" {...register("birthCertSeries")} />
        </Field>
        <Field label="Guvohnoma raqami" htmlFor="birthCertNumber">
          <Input id="birthCertNumber" placeholder="Kiriting" {...register("birthCertNumber")} />
        </Field>
      </FormSection>

      <FormSection title="Pasport ma'lumotlari">
        <Field label="Pasport seriyasi va raqami" htmlFor="passportNumber">
          <Input id="passportNumber" placeholder="AA 1234567" {...register("passportNumber")} />
        </Field>
        <Field label="JSHSHIR" htmlFor="passportPinfl">
          <Input id="passportPinfl" placeholder="14 ta raqam" {...register("passportPinfl")} />
        </Field>
        <Field label="Berilgan sanasi" htmlFor="passportIssuedDate">
          <Input id="passportIssuedDate" type="date" {...register("passportIssuedDate")} />
        </Field>
      </FormSection>

      <FormSection title="Ota-ona yoki vasiy ma'lumotlari">
        <Field label="FISH" htmlFor="parentFullName">
          <Input id="parentFullName" placeholder="Kiriting" {...register("parentFullName")} />
        </Field>
        <Field label="Qarindoshlik darajasi" htmlFor="parentRelation">
          <Select id="parentRelation" {...register("parentRelation")}>
            <option value="">Tanlang</option>
            {RELATIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </Field>
        <Field label="Pasport seriyasi va raqami" htmlFor="parentPassportNumber">
          <Input id="parentPassportNumber" placeholder="AA 1234567" {...register("parentPassportNumber")} />
        </Field>
        <Field label="JSHSHIR" htmlFor="parentPinfl">
          <Input id="parentPinfl" placeholder="14 ta raqam" {...register("parentPinfl")} />
        </Field>
        <Field label="Pasport berilgan sanasi" htmlFor="parentPassportIssuedDate">
          <Input id="parentPassportIssuedDate" type="date" {...register("parentPassportIssuedDate")} />
        </Field>
        <Field label="Pasport berilgan joyi" htmlFor="parentPassportIssuedBy">
          <Input id="parentPassportIssuedBy" placeholder="Kiriting" {...register("parentPassportIssuedBy")} />
        </Field>
        <Field label="Telefon raqami" htmlFor="parentPhone">
          <Input id="parentPhone" type="tel" placeholder="+998 ## ### ## ##" {...register("parentPhone")} />
        </Field>
      </FormSection>

      <FormSection title="Yashash manzili ma'lumotlari">
        <Field label="Viloyat" htmlFor="region">
          <Input id="region" placeholder="Kiriting" {...register("region")} />
        </Field>
        <Field label="Tuman" htmlFor="district">
          <Input id="district" placeholder="Kiriting" {...register("district")} />
        </Field>
        <Field label="To'liq manzil" htmlFor="address" span={2}>
          <Input id="address" placeholder="Kiriting" {...register("address")} />
        </Field>
      </FormSection>

      <FormSection title="Tizim ma'lumotlari">
        <Field label={terms.group} htmlFor="groupId" required error={errors.groupId?.message}>
          <Select id="groupId" error={errors.groupId?.message} {...register("groupId")}>
            <option value="">Tanlang</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Shaxsiy telefon raqami" htmlFor="phone">
          <Input id="phone" type="tel" placeholder="+998 ## ### ## ##" {...register("phone")} />
        </Field>
      </FormSection>

      <FormError message={serverError ?? undefined} />

      <FormActions>
        <Button type="button" variant="secondary" onClick={() => router.push("/students")}>
          Bekor qilish
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </FormActions>
    </form>
  );
}
