"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { SEGMENTS, SEGMENT_TERMS } from "@/lib/segment";
import { REGIONS } from "@/lib/regions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FormError } from "@/components/ui/FormError";
import { Field } from "@/components/ui/FormLayout";
import { ROOT_DOMAIN, isValidSlug, tenantUrl } from "@/lib/tenant";

type SlugStatus = "idle" | "checking" | "ok" | "taken" | "invalid";

/** "Renessans Maktabi" -> "renessans-maktabi" (taklif sifatida). */
function suggestSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[ʻ'`’‘]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);
  const [loginUrl, setLoginUrl] = useState("/login");
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { orgType: "markaz" },
  });

  const selectedType = watch("orgType");
  const orgName = watch("orgName");
  const orgSlug = watch("orgSlug");

  // Manzil taklifi: nomdan avtomatik, foydalanuvchi o'zgartirmaguncha.
  useEffect(() => {
    if (!slugTouched) setValue("orgSlug", suggestSlug(orgName ?? ""), { shouldValidate: false });
  }, [orgName, slugTouched, setValue]);

  // Manzil bandligini tekshirish (kechiktirib, har harfda emas).
  useEffect(() => {
    const value = (orgSlug ?? "").trim().toLowerCase();
    if (!value) {
      setSlugStatus("idle");
      return;
    }
    if (!isValidSlug(value)) {
      setSlugStatus("invalid");
      return;
    }
    setSlugStatus("checking");
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { data } = await createClient().rpc("slug_available", { p_slug: value });
      if (!cancelled) setSlugStatus(data === true ? "ok" : "taken");
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orgSlug]);

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const supabase = createClient();

    const { data: available } = await supabase.rpc("slug_available", { p_slug: values.orgSlug });
    if (available !== true) {
      setSlugStatus("taken");
      setServerError("Bu manzil band yoki noto'g'ri — boshqa manzil tanlang");
      return;
    }
    const schoolLogin = tenantUrl(values.orgSlug, "/login?registered=1", window.location);

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: schoolLogin,
        // Muassasa birinchi kirishda (lib/auth/session.ts) shu
        // ma'lumotlar asosida yaratiladi.
        data: {
          org_name: values.orgName,
          org_type: values.orgType,
          org_slug: values.orgSlug,
          tin: values.tin,
          region: values.region,
          district: values.district,
          address: values.address,
          director_last_name: values.directorLastName,
          director_first_name: values.directorFirstName,
          phone: values.phone,
        },
      },
    });

    if (error) {
      if (error.message === "User already registered") {
        setServerError("Bu email allaqachon ro'yxatdan o'tgan");
      } else if (error.status === 429) {
        setServerError(
          "Email yuborish limiti tugadi. Bir necha daqiqadan so'ng qayta urinib ko'ring.",
        );
      } else {
        setServerError("Ro'yxatdan o'tishda xatolik yuz berdi");
      }
      return;
    }

    // Sessiya asosiy saytda emas, maktabning o'z manzilida ochiladi.
    if (data.session) await supabase.auth.signOut();

    if (!data.session) {
      setLoginUrl(schoolLogin);
      setConfirmEmailSent(true);
      return;
    }

    window.location.href = schoolLogin;
  }

  if (confirmEmailSent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-canvas to-brand-100 px-4">
        <div className="max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-3 text-brand-600" size={40} />
          <h1 className="mb-2 text-xl font-semibold text-ink">
            Email tasdiqlanishi kerak
          </h1>
          <p className="text-sm text-ink-muted">
            Emailingizga tasdiqlash havolasi yuborildi. Tasdiqlagach,{" "}
            <a href={loginUrl} className="font-medium text-brand-600 hover:underline">
              maktabingiz manzilida kiring
            </a>{" "}
            — muassasangiz avtomatik yaratiladi.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-canvas to-brand-100 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex justify-center"><Logo className="h-14" /></div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm md:p-8">
          <h1 className="text-center text-2xl font-semibold text-ink">
            Ro&apos;yxatdan o&apos;tish
          </h1>
          <p className="mt-1 mb-6 text-center text-sm text-ink-muted">
            Muassasangizni tizimga qo&apos;shing — bir necha daqiqada tayyor
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* Muassasa turi */}
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                Muassasa turi
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {SEGMENTS.map((s) => {
                  const t = SEGMENT_TERMS[s];
                  const Icon = t.icon;
                  const isSelected = selectedType === s;

                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setValue("orgType", s, { shouldValidate: true })}
                      className={`rounded-xl border p-4 text-left transition-colors ${
                        isSelected
                          ? "border-brand-500 bg-brand-50 ring-1 ring-brand-200"
                          : "border-line bg-surface hover:bg-canvas"
                      }`}
                    >
                      <div
                        className={`mb-2 inline-flex rounded-lg p-2 ${
                          isSelected
                            ? "bg-brand-100 text-brand-600"
                            : "bg-canvas text-ink-faint"
                        }`}
                      >
                        <Icon size={20} />
                      </div>
                      <div className="text-sm font-medium text-ink">{t.label}</div>
                      <div className="mt-0.5 text-xs text-ink-muted">
                        {t.description}
                      </div>
                    </button>
                  );
                })}
              </div>
              <FormError message={errors.orgType?.message} />
            </section>

            {/* Muassasa ma'lumotlari */}
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                Muassasa ma&apos;lumotlari
              </h2>
              <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                  label="Muassasa nomi"
                  htmlFor="orgName"
                  required
                  error={errors.orgName?.message}
                >
                  <Input
                    id="orgName"
                    placeholder="Muassasa nomi"
                    error={errors.orgName?.message}
                    {...register("orgName")}
                  />
                </Field>

                <Field
                  label="Maktab manzili"
                  htmlFor="orgSlug"
                  required
                  error={errors.orgSlug?.message}
                >
                  <div className="flex items-center overflow-hidden rounded-lg border border-line bg-surface focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
                    <input
                      id="orgSlug"
                      autoCapitalize="none"
                      autoComplete="off"
                      placeholder="renessans"
                      className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-ink outline-none"
                      {...register("orgSlug", { onChange: () => setSlugTouched(true) })}
                    />
                    <span className="border-l border-line bg-canvas px-3 py-2.5 text-sm text-ink-muted">
                      .{ROOT_DOMAIN}
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-xs ${
                      slugStatus === "ok"
                        ? "text-emerald-600"
                        : slugStatus === "taken" || slugStatus === "invalid"
                          ? "text-red-600"
                          : "text-ink-faint"
                    }`}
                  >
                    {slugStatus === "checking" && "Tekshirilmoqda..."}
                    {slugStatus === "ok" && "Bu manzil bo'sh"}
                    {slugStatus === "taken" && "Bu manzil band yoki ishlatib bo'lmaydi"}
                    {slugStatus === "invalid" && "3–32 ta kichik harf, raqam yoki chiziqcha"}
                    {slugStatus === "idle" && "Maktabingiz shu manzilda ochiladi"}
                  </p>
                </Field>

                <Field label="STIR" htmlFor="tin">
                  <Input id="tin" placeholder="STIR" {...register("tin")} />
                </Field>

                <Field
                  label="Viloyat"
                  htmlFor="region"
                  required
                  error={errors.region?.message}
                >
                  <Select
                    id="region"
                    error={errors.region?.message}
                    {...register("region")}
                  >
                    <option value="">Viloyatni tanlang</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label="Tuman / Shahar"
                  htmlFor="district"
                  required
                  error={errors.district?.message}
                >
                  <Input
                    id="district"
                    placeholder="Tuman yoki shahar"
                    error={errors.district?.message}
                    {...register("district")}
                  />
                </Field>

                <Field label="To'liq manzil" htmlFor="address" span={2}>
                  <Input
                    id="address"
                    placeholder="To'liq manzil"
                    {...register("address")}
                  />
                </Field>
              </div>
            </section>

            {/* Rahbar ma'lumotlari */}
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                Rahbar ma&apos;lumotlari
              </h2>
              <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                  label="Familiyasi"
                  htmlFor="directorLastName"
                  required
                  error={errors.directorLastName?.message}
                >
                  <Input
                    id="directorLastName"
                    placeholder="Familiyasi"
                    error={errors.directorLastName?.message}
                    {...register("directorLastName")}
                  />
                </Field>

                <Field
                  label="Ismi"
                  htmlFor="directorFirstName"
                  required
                  error={errors.directorFirstName?.message}
                >
                  <Input
                    id="directorFirstName"
                    placeholder="Ismi"
                    error={errors.directorFirstName?.message}
                    {...register("directorFirstName")}
                  />
                </Field>

                <Field
                  label="Telefon raqami"
                  htmlFor="phone"
                  required
                  error={errors.phone?.message}
                >
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+998"
                    error={errors.phone?.message}
                    {...register("phone")}
                  />
                </Field>
              </div>
            </section>

            {/* Tizimga kirish ma'lumotlari */}
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                Tizimga kirish ma&apos;lumotlari
              </h2>
              <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                <Field
                  label="Email"
                  htmlFor="email"
                  required
                  error={errors.email?.message}
                >
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email"
                    error={errors.email?.message}
                    {...register("email")}
                  />
                </Field>

                <Field
                  label="Parol"
                  htmlFor="password"
                  required
                  error={errors.password?.message}
                >
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Parol"
                    error={errors.password?.message}
                    {...register("password")}
                  />
                </Field>
              </div>
            </section>

            <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-700">
              <CheckCircle2 size={18} />
              Sinov muddatida tizimdan bepul foydalanib ko&apos;rishingiz mumkin
            </div>

            <div>
              <label className="flex items-start gap-2 text-sm text-ink-muted">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
                  {...register("acceptTerms")}
                />
                <span>
                  Men foydalanish shartlarini o&apos;qib chiqdim va shaxsiy
                  ma&apos;lumotlarni qayta ishlashga roziman
                </span>
              </label>
              <FormError message={errors.acceptTerms?.message} />
            </div>

            <FormError message={serverError ?? undefined} />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Yuborilmoqda..." : "Ro'yxatdan o'tish"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Hisobingiz bormi?{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:underline">
              Kirish
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
