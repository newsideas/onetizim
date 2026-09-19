"use client";

import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";
import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { safeNextPath } from "@/lib/utils/safeNextPath";

/**
 * Login formasi. Sarlavha manzilga qarab o'zgaradi: maktab nomi
 * (renessans.edugram.uz) yoki "Super Admin" (admin.edugram.uz).
 */
export function LoginForm({
  title,
  subtitle,
  notice,
}: {
  title: string;
  subtitle: string;
  notice?: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setServerError("Email yoki parol noto'g'ri");
      return;
    }

    router.push(safeNextPath(new URLSearchParams(window.location.search).get("next")));
    router.refresh();
  }

  return (
    <main className="flex min-h-screen bg-gradient-to-br from-brand-50 via-canvas to-brand-100">
      <AuthShowcase />

      <div className="flex w-full items-center justify-center px-4 py-10 lg:w-1/2">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-sm">
          <Logo className="mb-6 h-12" />

          <h1 className="text-2xl font-semibold text-ink">{title}</h1>
          <p className="mt-1 mb-6 text-sm text-ink-muted">{subtitle}</p>

          {notice && (
            <p className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{notice}</p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="direktor@maktab.uz"
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
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password")}
              />
              <FormError message={errors.password?.message} />
            </div>

            <FormError message={serverError ?? undefined} />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Kirilmoqda..." : "Kirish"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
