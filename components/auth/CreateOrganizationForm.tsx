"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";
import { useSignOut } from "@/components/auth/useSignOut";
import { createOwnOrganization } from "@/lib/actions/membership";
import { SEGMENTS, SEGMENT_TERMS } from "@/lib/segment";
import {
  createOrganizationSchema,
  type CreateOrganizationInput,
} from "@/lib/validations/auth";

export function CreateOrganizationForm() {
  const router = useRouter();
  const signOut = useSignOut();
  const [serverError, setServerError] = useState<string>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrganizationInput>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: { orgType: "markaz" },
  });

  async function onSubmit(values: CreateOrganizationInput) {
    setServerError(undefined);
    const result = await createOwnOrganization(values);
    if (!result.ok) return setServerError(result.error);
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="orgName">Muassasa nomi</Label>
        <Input id="orgName" error={errors.orgName?.message} {...register("orgName")} />
        <FormError message={errors.orgName?.message} />
      </div>

      <div>
        <Label htmlFor="orgType">Muassasa turi</Label>
        <select
          id="orgType"
          {...register("orgType")}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
        >
          {SEGMENTS.map((segment) => (
            <option key={segment} value={segment}>
              {SEGMENT_TERMS[segment].label}
            </option>
          ))}
        </select>
        <FormError message={errors.orgType?.message} />
      </div>

      <FormError message={serverError} />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Yaratilmoqda..." : "Muassasa yaratish"}
      </Button>

      <button
        type="button"
        onClick={() => void signOut()}
        className="w-full text-center text-sm text-ink-muted hover:text-ink"
      >
        Chiqish
      </button>
    </form>
  );
}
