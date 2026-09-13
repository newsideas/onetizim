import {
  STUDENT_STATUS_LABELS,
  STUDENT_STATUS_CLASSES,
} from "@/lib/validations/student";
import type { StudentStatus } from "@/types/database";

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${STUDENT_STATUS_CLASSES[status]}`}
    >
      {STUDENT_STATUS_LABELS[status]}
    </span>
  );
}
