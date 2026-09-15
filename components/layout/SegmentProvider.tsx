"use client";

import { createContext, useContext, type ReactNode } from "react";
import { termsFor, type Segment, type SegmentTerms } from "@/lib/segment";

interface SegmentContextValue {
  segment: Segment;
  terms: SegmentTerms;
}

const SegmentContext = createContext<SegmentContextValue | null>(null);

/**
 * Muassasa turini client komponentlarga uzatadi. Dashboard layout'da
 * o'raladi — server u yerda tashkilot turini bazadan oladi.
 */
export function SegmentProvider({
  segment,
  children,
}: {
  segment: Segment;
  children: ReactNode;
}) {
  return (
    <SegmentContext.Provider value={{ segment, terms: termsFor(segment) }}>
      {children}
    </SegmentContext.Provider>
  );
}

/** Client komponentlarda atamalarni olish: const { terms } = useSegment(). */
export function useSegment(): SegmentContextValue {
  const ctx = useContext(SegmentContext);
  if (!ctx) {
    throw new Error("useSegment faqat SegmentProvider ichida ishlatiladi");
  }
  return ctx;
}
