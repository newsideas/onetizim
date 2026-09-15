import Image from "next/image";

/**
 * EDUGRAM SYSTEM logotipi.
 *
 * Ikki variant bor:
 * - `brand` (standart) — sayt brend rangida (oq fonda yaxshi o'qiladi).
 *   SVG ichidagi rang `currentColor` bo'lgani uchun matn rangidan oladi.
 * - `original` — logotipning o'z rangi (#10fa9f), to'q fon uchun.
 */
export function Logo({
  variant = "brand",
  className = "h-10",
}: {
  variant?: "brand" | "original";
  className?: string;
}) {
  const src = variant === "brand" ? "/logo-brand.svg" : "/logo.svg";

  return (
    <span
      className={`inline-flex items-center ${className}`}
    >
      <Image
        src={src}
        alt="EDUGRAM SYSTEM"
        width={180}
        height={180}
        className="h-full w-auto"
        priority
      />
    </span>
  );
}
