"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";
import { useSignOut } from "@/components/auth/useSignOut";
import { createClient } from "@/lib/supabase/client";
import { acceptInvite } from "@/lib/actions/membership";
import { inviteSignupSchema, type InviteSignupInput } from "@/lib/validations/auth";

/** Kirgan foydalanuvchi taklifni qabul qiladi. */
export function AcceptInvite({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const signOut = useSignOut(`/invite/${token}`);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function accept() {
    setError(undefined);
    startTransition(async () => {
      const result = await acceptInvite(token);
      if (!result.ok) return setError(result.error);
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-canvas px-3 py-2 text-sm text-ink-muted">
        Siz <span className="font-medium text-ink">{email}</span> sifatida kirgansiz.
      </p>
      <FormError message={error} />
      <Button className="w-full" onClick={accept} disabled={isPending}>
        {isPending ? "Qabul qilinmoqda..." : "Taklifni qabul qilish"}
      </Button>
      <button
        type="button"
        onClick={() => void signOut()}
        className="w-full text-center text-sm text-ink-muted hover:text-ink"
      >
        Boshqa hisob bilan kirish
      </button>
    </div>
  );
}

/** Hisobi yo'q xodim shu yerning o'zida ro'yxatdan o'tadi. */
export function InviteSignup({ token }: { token: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>();
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InviteSignupInput>({ resolver: zodResolver(inviteSignupSchema) });

  async function onSubmit(values: InviteSignupInput) {
    setServerError(undefined);
    const { data, error } = await createClient().auth.signUp({
      email: values.email,
      password: values.password,
      // Email tasdiqlangach birinchi kirishda taklif avtomatik qabul qilinadi.
      options: { data: { invite_token: token, full_name: values.fullName } },
    });

    if (error) {
      setServerError(
        error.message === "User already registered"
          ? "Bu email ro'yxatdan o'tgan — pastdagi \"Kirish\" orqali kiring"
          : error.status === 429
            ? "Juda ko'p urinish. Bir necha daqiqadan so'ng qayta urinib ko'ring"
            : "Ro'yxatdan o'tishda xatolik yuz berdi",
      );
      return;
    }

    if (!data.session) {
      setConfirmEmailSent(true);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (confirmEmailSent) {
    return (
      <p className="rounded-lg bg-brand-50 px-3 py-3 text-sm text-brand-700">
        Emailingizga tasdiqlash havolasi yuborildi. Tasdiqlagandan keyin tizimga kiring —
        taklif avtomatik qabul qilinadi.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="fullName">Familiya va ism</Label>
        <Input id="fullName" autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
        <FormError message={errors.fullName?.message} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
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

      <FormError message={serverError} />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Yuborilmoqda..." : "Ro'yxatdan o'tish va qo'shilish"}
      </Button>

      <p className="text-center text-sm text-ink-muted">
        Hisobingiz bormi?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}
          className="font-medium text-brand-600 hover:underline"
        >
          Kirish
        </Link>
      </p>
    </form>
  );
}
