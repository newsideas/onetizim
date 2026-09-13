import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { error?: string }
>(function Input({ className = "", error, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-lg border bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        error ? "border-red-500" : "border-white/10"
      } ${className}`}
      {...props}
    />
  );
});
