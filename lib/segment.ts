import type { LucideIcon } from "lucide-react";
import { GraduationCap } from "lucide-react";

/**
 * Muassasa turi. Tizim faqat o'quv markazlarga xizmat qiladi; maktab va
 * bog'cha turlari olib tashlangan (0043 migratsiyasi bazadagi qiymatlarni ham
 * `markaz` ga o'tkazadi). Tur nomi atamalar (`SEGMENT_TERMS`) uchun saqlanadi.
 */
export type Segment = "markaz";

export const SEGMENTS: Segment[] = ["markaz"];

export interface SegmentTerms {
  /** Muassasa turi nomi */
  label: string;
  /** Qisqacha tavsif */
  description: string;
  icon: LucideIcon;
  /** Guruhlash birligi */
  group: string;
  groupPlural: string;
  /** Yangi guruh tugmasi matni */
  newGroup: string;
  student: string;
  studentPlural: string;
  newStudent: string;
  lesson: string;
  lessonPlural: string;
  teacher: string;
  /** Jadval sahifasi nomi */
  schedule: string;
}

export const SEGMENT_TERMS: Record<Segment, SegmentTerms> = {
  markaz: {
    label: "O'quv markaz",
    description: "Kurs guruhlari, oylik to'lov va sinov darsi",
    icon: GraduationCap,
    group: "Guruh",
    groupPlural: "Guruhlar",
    newGroup: "Yangi guruh",
    student: "O'quvchi",
    studentPlural: "O'quvchilar",
    newStudent: "Yangi o'quvchi",
    lesson: "Dars",
    lessonPlural: "Darslar",
    teacher: "O'qituvchi",
    schedule: "Dars jadvali",
  },
};

/** Bazada eski qiymat ("maktab", "bogcha", "togarak") qolgan bo'lsa ham ilova buzilmasligi uchun. */
export function termsFor(segment?: string | null): SegmentTerms {
  void segment;
  return SEGMENT_TERMS.markaz;
}
