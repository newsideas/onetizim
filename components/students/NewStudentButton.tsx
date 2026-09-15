"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useSegment } from "@/components/layout/SegmentProvider";

/** Qo'shish endi modal emas — to'liq sahifali formaga olib boradi. */
export function NewStudentButton() {
  const { terms } = useSegment();

  return (
    <Link
      href="/students/new"
      className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
    >
      <Plus size={16} />
      {terms.newStudent}
    </Link>
  );
}
