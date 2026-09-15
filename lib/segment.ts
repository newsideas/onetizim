import type { LucideIcon } from "lucide-react";
import { School, Baby, GraduationCap } from "lucide-react";

/**
 * Muassasa turi. Ro'yxatdan o'tishda tanlanadi va butun interfeys shunga
 * moslashadi: atamalar, sidebar bo'limlari, mavjud modullar.
 */
export type Segment = "maktab" | "bogcha" | "markaz";

export const SEGMENTS: Segment[] = ["maktab", "bogcha", "markaz"];

/** Har segment o'z atamalari bilan gapiradi. */
export interface SegmentTerms {
  /** Muassasa turi nomi */
  label: string;
  /** Qisqacha tavsif (ro'yxatdan o'tish sahifasida) */
  description: string;
  icon: LucideIcon;
  /** Guruhlash birligi: Sinf / Guruh */
  group: string;
  groupPlural: string;
  /** Yangi guruh tugmasi matni */
  newGroup: string;
  /** O'quvchi / Bola */
  student: string;
  studentPlural: string;
  newStudent: string;
  /** Dars / Mashg'ulot */
  lesson: string;
  lessonPlural: string;
  /** O'qituvchi / Tarbiyachi */
  teacher: string;
  /** Jadval sahifasi nomi */
  schedule: string;
}

export const SEGMENT_TERMS: Record<Segment, SegmentTerms> = {
  maktab: {
    label: "Xususiy maktab",
    description: "Sinflar, choraklar, baho jurnali va ko'p fanli dars jadvali",
    icon: School,
    group: "Sinf",
    groupPlural: "Sinflar",
    newGroup: "Yangi sinf",
    student: "O'quvchi",
    studentPlural: "O'quvchilar",
    newStudent: "Yangi o'quvchi",
    lesson: "Dars",
    lessonPlural: "Darslar",
    teacher: "O'qituvchi",
    schedule: "Dars jadvali",
  },
  bogcha: {
    label: "Bog'cha",
    description:
      "Yosh guruhlari, kun tartibi, tibbiy ma'lumot va kelish–ketish nazorati",
    icon: Baby,
    group: "Guruh",
    groupPlural: "Guruhlar",
    newGroup: "Yangi guruh",
    student: "Bola",
    studentPlural: "Bolalar",
    newStudent: "Yangi bola",
    lesson: "Mashg'ulot",
    lessonPlural: "Mashg'ulotlar",
    teacher: "Tarbiyachi",
    schedule: "Kun tartibi",
  },
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

/** Noma'lum qiymat kelsa ham ilova buzilmasligi uchun. */
export function termsFor(segment: string | null | undefined): SegmentTerms {
  return SEGMENT_TERMS[(segment as Segment) ?? "markaz"] ?? SEGMENT_TERMS.markaz;
}
