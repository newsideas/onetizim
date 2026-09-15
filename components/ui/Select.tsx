import { SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { error?: string }
>(function Select({ className = "", error, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={`w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none ${
        error ? "border-red-400" : "border-line"
      } ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});
