import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { error?: string }
>(function Input({ className = "", error, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none ${
        error ? "border-red-400" : "border-line"
      } ${className}`}
      {...props}
    />
  );
});
