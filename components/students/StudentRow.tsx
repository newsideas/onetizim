// TODO: 6-bosqich — balans manfiy bo'lsa qizil rangda ko'rsatish.
import type { Student } from "@/types/database";

export function StudentRow({ student }: { student: Student }) {
  return <div>{student.full_name}</div>;
}
