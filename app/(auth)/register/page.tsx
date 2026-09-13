"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { FormError } from "@/components/ui/FormError";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { orgType: "togarak" },
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        // Tashkilot email tasdiqlangach, ensureOrganization() shu
        // ma'lumotlar asosida yaratadi (lib/supabase/ensureOrganization.ts).
        data: { org_name: values.orgName, org_type: values.orgType },
      },
    });

    if (error) {
      setServerError(
        error.message === "User already registered"
          ? "Bu email allaqachon ro'yxatdan o'tgan"
          : "Ro'yxatdan o'tishda xatolik yuz berdi",
      );
      return;
    }

    if (!data.session) {
      // Loyihada email tasdiqlash yoqilgan — sessiya darhol berilmaydi.
      setConfirmEmailSent(true);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (confirmEmailSent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f1420] px-4">
        <div className="max-w-sm text-center text-white">
          <h1 className="mb-2 text-xl font-semibold">Email tasdiqlanishi kerak</h1>
          <p className="text-white/60">
            Emailingizga tasdiqlash havolasi yuborildi. Tasdiqlagach,{" "}
            <Link href="/login" className="text-blue-400 hover:underline">
              tizimga kiring
            </Link>{" "}
            — tashkilotingiz avtomatik yaratiladi.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f1420] px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold text-white">
          Ro&apos;yxatdan o&apos;tish
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="orgName">Tashkilot nomi</Label>
            <Input
              id="orgName"
              placeholder="Masalan: Iqbol to'garagi"
              error={errors.orgName?.message}
              {...register("orgName")}
            />
            <FormError message={errors.orgName?.message} />
          </div>

          <div>
            <Label htmlFor="orgType">Tashkilot turi</Label>
            <Select id="orgType" error={errors.orgType?.message} {...register("orgType")}>
              <option value="togarak">To&apos;garak</option>
              <option value="maktab">Xususiy maktab</option>
            </Select>
            <FormError message={errors.orgType?.message} />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <FormError message={errors.email?.message} />
          </div>

          <div>
            <Label htmlFor="password">Parol</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <FormError message={errors.password?.message} />
          </div>

          <FormError message={serverError ?? undefined} />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Yuborilmoqda..." : "Ro'yxatdan o'tish"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-white/60">
          Hisobingiz bormi?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Kirish
          </Link>
        </p>
      </div>
    </main>
  );
}
