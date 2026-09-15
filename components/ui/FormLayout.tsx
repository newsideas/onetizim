import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";

/**
 * To'liq sahifali forma tuzilmasi: breadcrumb + "Ortga", bo'limlarga
 * ajratilgan maydonlar, pastda saqlash tugmalari.
 */
export function FormPageHeader({
  title,
  breadcrumb,
  backHref,
}: {
  title: string;
  breadcrumb: string;
  backHref: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        <p className="text-sm text-ink-faint">{breadcrumb}</p>
      </div>
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600"
      >
        <ArrowLeft size={16} />
        Ortga
      </Link>
    </div>
  );
}

/** Forma ichidagi bo'lim: sarlavha + maydonlar gridi. */
export function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
        {children}
      </div>
    </section>
  );
}

/**
 * Bitta maydon: yorliq (majburiy bo'lsa qizil yulduzcha) + kiritish
 * elementi + xato matni.
 */
export function Field({
  label,
  htmlFor,
  required,
  error,
  span,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  /** Keng maydonlar uchun (masalan to'liq manzil) */
  span?: 2 | 4;
  children: ReactNode;
}) {
  const spanClass =
    span === 4
      ? "sm:col-span-2 xl:col-span-4"
      : span === 2
        ? "sm:col-span-2"
        : "";

  return (
    <div className={spanClass}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {children}
      <FormError message={error} />
    </div>
  );
}

/** Forma pastidagi amal tugmalari. */
export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end gap-2 border-t border-line pt-4">
      {children}
    </div>
  );
}
