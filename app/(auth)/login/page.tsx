"use client";

import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";
import { AuthShowcase } from "@/components/auth/AuthShowcase";

export default function LoginPage() {
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

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen bg-gradient-to-br from-brand-50 via-canvas to-brand-100">
      <AuthShowcase />

      <div className="flex w-full items-center justify-center px-4 py-10 lg:w-1/2">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-sm">
          <Logo className="mb-6 h-12" />

          <h1 className="text-2xl font-semibold text-ink">Tizimga kirish</h1>
          <p className="mt-1 mb-6 text-sm text-ink-muted">
            Muassasangiz hisobiga kiring va ishni davom ettiring
          </p>

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

          <p className="mt-6 text-center text-sm text-ink-muted">
            Hisobingiz yo&apos;qmi?{" "}
            <Link href="/register" className="font-medium text-brand-600 hover:underline">
              Ro&apos;yxatdan o&apos;tish
            </Link>
          </p>

          <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-center text-xs text-brand-700">
            Yangi muassasalar uchun sinov muddati bepul
          </p>
        </div>
      </div>
    </main>
  );
}
