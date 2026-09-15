"use client";

import { Moon, Sun } from "lucide-react";
import { THEME_COOKIE } from "@/lib/theme";

/**
 * Yorug'/to'q mavzu almashtirgichi.
 *
 * Tanlov cookie'da saqlanadi va server root layout'da `data-theme`
 * atributini qo'yadi, shuning uchun sahifa yuklanishida rang sakramaydi.
 * Tugmaning o'zi holat saqlamaydi — ikonkani CSS tanlaydi.
 */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const current =
      root.dataset.theme === "dark" || root.dataset.theme === "light"
        ? root.dataset.theme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    // Bir yil — keyingi tashriflarda ham o'sha mavzu ochiladi.
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
      aria-label="Mavzuni almashtirish"
      title="Mavzuni almashtirish"
    >
      <Moon size={18} className="theme-icon-light" />
      <Sun size={18} className="theme-icon-dark" />
    </button>
  );
}
