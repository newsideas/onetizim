"use client";

import { useState, type FormEvent } from "react";
import { ChevronDown, Eye, EyeOff, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { formatPhone, identityToEmail, parseIdentity } from "@/lib/auth/identity";
import { safeNextPath } from "@/lib/utils/safeNextPath";

// Kirish oynasi har doim yorug' (Edu tizimdagidek): ranglar mavzuga qarab o'zgarmaydi.
const FIELD =
  "h-9 w-full rounded-lg bg-[#e7eaeb] px-3 text-[13px] text-[#1a1a1a] outline-none ring-brand-500/30 transition-shadow duration-200 placeholder:text-[#8a8f94] focus:ring-2";
const BUTTON =
  "h-9 w-full rounded-lg bg-brand-600 text-[13px] font-medium text-white transition-all duration-300 ease-(--ease-edu) hover:bg-brand-700 disabled:opacity-60";

/** Telefon maydoni Edu tizimdagidek "+998" bilan boshlanadi; login bilan kiradiganlar uni o'chirib yozadi. */
const PHONE_PREFIX = "+998";

/**
 * Kirish: Edu tizimdagidek ikki bosqich. 1) telefon raqam (yoki login),
 * 2) parol. Super admin ham, markaz xodimlari ham telefon/login va parol bilan kiradi.
 */
export function LoginForm({
  schoolName,
  slug,
  notice,
}: {
  schoolName?: string;
  slug?: string;
  notice?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState(PHONE_PREFIX);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  const identity = parseIdentity(identifier);
  function next(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!identity) return setError("Telefon raqam yoki loginni to'g'ri kiriting");
    setError(undefined);
    setStep(2);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = identityToEmail(identifier, slug);
    if (!email) return setError("Kirish ma'lumotlari noto'g'ri");
    if (password.length < 6) return setError("Parolni kiriting");

    setError(undefined);
    setPending(true);
    const { error: signInError } = await createClient().auth.signInWithPassword({ email, password });
    setPending(false);

    if (signInError) return setError("Telefon/login yoki parol noto'g'ri");

    router.push(safeNextPath(new URLSearchParams(window.location.search).get("next")));
    router.refresh();
  }

  const shown = identity
    ? identity.kind === "phone"
      ? formatPhone(identity.value)
      : identity.value
    : identifier;

  return (
    <main className="flex min-h-screen flex-col bg-white bg-[linear-gradient(80.18deg,rgba(48,46,145,0.3)_0%,rgba(57,118,174,0.3)_100%)]">
      <div className="mx-auto flex w-full max-w-[1000px] items-start justify-between px-4 pt-6">
        <div className="flex items-center gap-3">
          <Logo variant="brand" className="h-6" />
          <span className="hidden border-l border-[#c9ccd6] pl-3 text-sm text-[#3a3d4a] sm:block">
            bilan yanada osonroq
          </span>
        </div>

        {/* Til: hozircha faqat o'zbekcha. */}
        <span
          aria-label="Til: o'zbekcha"
          className="flex h-[42px] items-center gap-2.5 rounded-lg bg-white px-3.5 text-[#1a1a1a] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
        >
          <span
            aria-hidden="true"
            className="h-[18px] w-[26px] rounded-[3px] border border-black/10 bg-[linear-gradient(#1eb4e6_0_31%,#ce1126_31%_36%,#fff_36%_64%,#ce1126_64%_69%,#1eb53a_69%)]"
          />
          <ChevronDown size={16} aria-hidden="true" />
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-24">
        <div className="w-full max-w-[480px] rounded-xl bg-white p-[50px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] max-sm:p-6">
          <h1 className="mb-6 text-center text-xl font-semibold text-[#111]">Kirish</h1>
          {schoolName && <p className="-mt-4 mb-5 text-center text-[13px] text-[#6b6f7a]">{schoolName}</p>}

          {notice && (
            <p className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-[13px] text-brand-700">{notice}</p>
          )}

          {step === 1 ? (
            <form onSubmit={next} className="space-y-4" noValidate>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoFocus
                autoComplete="username"
                inputMode="text"
                placeholder="+998 90 123 45 67 yoki login"
                aria-label="Telefon raqam yoki login"
                className={FIELD}
              />
              {error && <p className="text-[13px] text-red-600">{error}</p>}
              <button type="submit" className={BUTTON}>
                Tasdiqlash
              </button>
            </form>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div className="flex items-center justify-between rounded-lg bg-[#e7eaeb] px-3 py-2 text-[13px] text-[#1a1a1a]">
                <span className="truncate">{shown}</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setPassword("");
                    setError(undefined);
                  }}
                  aria-label="Raqamni o'zgartirish"
                  className="ml-2 shrink-0 text-[#6b6f7a] transition-colors hover:text-brand-600"
                >
                  <Pencil size={14} />
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  autoComplete="current-password"
                  placeholder="Parolni kiriting"
                  aria-label="Parol"
                  className={`${FIELD} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-[#8a8f94] transition-colors hover:text-[#1a1a1a]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && <p className="text-[13px] text-red-600">{error}</p>}

              <button type="submit" disabled={pending} className={BUTTON}>
                {pending ? "Kirilmoqda..." : "Kirish"}
              </button>

              <p className="text-center text-xs text-[#8a8f94]">
                Parolni unutdingizmi? Direktor yoki o&apos;quv menejeri yangi parol beradi.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
