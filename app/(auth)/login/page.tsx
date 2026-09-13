"use client";

import { useState } from "react";
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
    <main className="flex min-h-screen items-center justify-center bg-[#0f1420] px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold text-white">
          Kirish
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
              autoComplete="current-password"
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

        <p className="mt-6 text-center text-sm text-white/60">
          Hisobingiz yo&apos;qmi?{" "}
          <Link href="/register" className="text-blue-400 hover:underline">
            Ro&apos;yxatdan o&apos;tish
          </Link>
        </p>
      </div>
    </main>
  );
}
