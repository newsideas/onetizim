"use client";

import { useEffect } from "react";

/** Super admin paneli har doim oq fonda ko'rinadi (tizim qorong'i rejimida bo'lsa ham). */
export function ForceLightTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.dataset.theme;
    root.dataset.theme = "light";
    return () => {
      if (previous === undefined) delete root.dataset.theme;
      else root.dataset.theme = previous;
    };
  }, []);

  return null;
}
