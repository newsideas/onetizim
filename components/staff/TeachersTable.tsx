"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Power, Trash2 } from "lucide-react";
import { useTeachers, type TeacherRow } from "@/components/staff/TeachersProvider";
import { deleteTeacher, setTeacherActive } from "@/lib/actions/staff";
import { SALARY_TYPE_LABELS } from "@/lib/validations/finance";
import { TEACHER_KIND_LABELS } from "@/lib/validations/staff";
import { formatSom } from "@/lib/utils/currency";

function rateLabel(row: TeacherRow): string {
  if (!row.salary_type || row.rate == null) return "—";
  const suffix = row.salary_type === "percent" ? "%" : "";
  const value = row.salary_type === "percent" ? row.rate : formatSom(row.rate);
  return `${SALARY_TYPE_LABELS[row.salary_type]} · ${value}${suffix}`;
}

export function TeachersTable({ teachers }: { teachers: TeacherRow[] }) {
  const router = useRouter();
  const { openEdit } = useTeachers();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.error ?? null);
      router.refresh();
    });
  }

  function toggleActive(teacher: TeacherRow) {
    run(() => setTeacherActive(teacher.id, !teacher.is_active));
  }

  function remove(teacher: TeacherRow) {
    if (!confirm(`"${teacher.full_name}"ni o'chirmoqchimisiz?`)) return;
    run(() => deleteTeacher(teacher.id));
  }

  if (teachers.length === 0) {
    return (
      <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
        Hali xodim qo&apos;shilmagan. &quot;Xodim qo&apos;shish&quot; tugmasi orqali kiriting.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">FISH</th>
              <th className="px-4 py-3 font-medium">Toifa</th>
              <th className="px-4 py-3 font-medium">Lavozim</th>
              <th className="px-4 py-3 font-medium">Telefon</th>
              <th className="px-4 py-3 font-medium">Maosh</th>
              <th className="px-4 py-3 font-medium">Holati</th>
              <th className="px-4 py-3 font-medium">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {teachers.map((t) => (
              <tr key={t.id} className={`hover:bg-canvas ${!t.is_active ? "opacity-60" : ""}`}>
                <td className="px-4 py-3 font-medium text-ink">{t.full_name}</td>
                <td className="px-4 py-3 text-ink-muted">{TEACHER_KIND_LABELS[t.kind]}</td>
                <td className="px-4 py-3 text-ink-muted">{t.position || "—"}</td>
                <td className="px-4 py-3 text-ink-muted">{t.phone || "—"}</td>
                <td className="px-4 py-3 text-ink-muted">{rateLabel(t)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      t.is_active
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "bg-canvas text-ink-faint"
                    }`}
                  >
                    {t.is_active ? "Faol" : "Nofaol"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      disabled={isPending}
                      className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-canvas hover:text-ink disabled:opacity-40"
                      aria-label="Tahrirlash"
                      title="Tahrirlash"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(t)}
                      disabled={isPending}
                      className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-canvas hover:text-ink disabled:opacity-40"
                      aria-label={t.is_active ? "Nofaol qilish" : "Faollashtirish"}
                      title={t.is_active ? "Nofaol qilish" : "Faollashtirish"}
                    >
                      <Power size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(t)}
                      disabled={isPending}
                      className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      aria-label="O'chirish"
                      title="O'chirish"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
