import { SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { error?: string }
>(function Select({ className = "", error, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={`w-full rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        error ? "border-red-500" : "border-white/10"
      } ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});
