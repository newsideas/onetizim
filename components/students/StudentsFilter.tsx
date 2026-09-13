"use client";

import Link from "next/link";
import { STUDENT_STATUS_LABELS } from "@/lib/validations/student";

const FILTERS = [
  { value: "active", label: STUDENT_STATUS_LABELS.active },
  { value: "frozen", label: STUDENT_STATUS_LABELS.frozen },
  { value: "archived", label: STUDENT_STATUS_LABELS.archived },
  { value: "all", label: "Hammasi" },
] as const;

export function StudentsFilter({ current }: { current: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => (
        <Link
          key={f.value}
          href={f.value === "active" ? "/students" : `/students?status=${f.value}`}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            current === f.value
              ? "bg-blue-600 text-white"
              : "bg-white/5 text-white/60 hover:bg-white/10"
          }`}
        >
          {f.label}
        </Link>
      ))}
    </div>
  );
}
