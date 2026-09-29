import type { LucideIcon } from "lucide-react";
import { GraduationCap, School } from "lucide-react";

/**
 * Muassasa turi: o'quv markaz yoki xususiy maktab (0074). Tur atamalarni (`SEGMENT_TERMS`),
 * menyuni va ba'zi formalarni belgilaydi; ma'lumotlar tuzilmasi ikkalasida umumiy
 * (maktabda "guruh" — sinf, guruh o'qituvchisi — sinf rahbari).
 */
export type Segment = "markaz" | "maktab";

export const SEGMENTS: Segment[] = ["markaz", "maktab"];

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
  /** Guruhga biriktirilgan xodim: markazda o'qituvchi, maktabda sinf rahbari. */
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
  maktab: {
    label: "Xususiy maktab",
    description: "Sinflar, fanlar bo'yicha dars jadvali, shartnoma asosida to'lov",
    icon: School,
    group: "Sinf",
    groupPlural: "Sinflar",
    newGroup: "Yangi sinf",
    student: "O'quvchi",
    studentPlural: "O'quvchilar",
    newStudent: "Yangi o'quvchi",
    lesson: "Dars",
    lessonPlural: "Darslar",
    teacher: "Sinf rahbari",
    schedule: "Dars jadvali",
  },
};

export function isSegment(value: unknown): value is Segment {
  return value === "markaz" || value === "maktab";
}

/** Bazada eski yoki noma'lum qiymat ("bogcha", "togarak") bo'lsa — o'quv markaz atamalari. */
export function termsFor(segment?: string | null): SegmentTerms {
  return SEGMENT_TERMS[isSegment(segment) ? segment : "markaz"];
}
