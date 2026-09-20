"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Pencil, Power, Trash2 } from "lucide-react";
import { useDialogs } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { financeInputClass } from "@/components/finance/MoneyEntryModal";
import { useTeachers, type TeacherRow } from "@/components/staff/TeachersProvider";
import { deleteTeacher, setTeacherActive } from "@/lib/actions/staff";
import { STAFF_LEAVE_REASONS, TEACHER_KIND_LABELS } from "@/lib/validations/staff";
import { formatDate, todayIso } from "@/lib/utils/date";

export interface TeacherListRow extends TeacherRow {
  groupNames: string[];
  studentCount: number;
  branchNames: string[];
}

const TH = "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase";

export function TeachersTable({ teachers, offset = 0 }: { teachers: TeacherListRow[]; offset?: number }) {
  const router = useRouter();
  const { openEdit } = useTeachers();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<TeacherListRow | null>(null);
  const [leaveDate, setLeaveDate] = useState(todayIso());
  const [leaveReason, setLeaveReason] = useState<string>(STAFF_LEAVE_REASONS[0]);
  const { confirm, dialogs } = useDialogs();

  function run(action: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.error ?? null);
      after?.();
      router.refresh();
    });
  }

  function toggleActive(teacher: TeacherListRow) {
    if (teacher.is_active) {
      setLeaveDate(todayIso());
      setLeaveReason(STAFF_LEAVE_REASONS[0]);
      setLeaving(teacher);
      return;
    }
    run(() => setTeacherActive(teacher.id, true));
  }

  async function remove(teacher: TeacherListRow) {
    if (!(await confirm(`"${teacher.full_name}"ni o'chirmoqchimisiz?`, { danger: true, confirmLabel: "O'chirish" }))) return;
    run(() => deleteTeacher(teacher.id));
  }

  return (
    <div className="space-y-2">
      {dialogs}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-canvas">
            <tr>
              <th className={`${TH} w-12`}>№</th>
              <th className={TH}>To&apos;liq nomi</th>
              <th className={TH}>Jinsi</th>
              <th className={TH}>Aktiv o&apos;quvchilar soni</th>
              <th className={TH}>Guruhlar</th>
              <th className={TH}>Turi</th>
              <th className={TH}>Filiallar</th>
              <th className={TH}>Telefon raqam</th>
              <th className={TH}>Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center">
                  <Inbox size={22} className="mx-auto mb-2 text-ink-faint" aria-hidden="true" />
                  <div className="text-sm font-medium text-ink-muted">Ma&apos;lumotlar topilmadi</div>
                  <div className="mt-0.5 text-xs text-ink-faint">Ma&apos;lumotlar topilmadi. Filterni o&apos;zgartirib ko&apos;ring.</div>
                </td>
              </tr>
            ) : (
              teachers.map((t, i) => (
                <tr key={t.id} className={`hover:bg-canvas ${!t.is_active ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3 text-ink-faint">{offset + i + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/staff/${t.id}`} className="font-medium text-ink hover:text-brand-600 hover:underline">
                      {t.full_name}
                    </Link>
                    {!t.is_active && t.left_on && (
                      <div className="text-xs text-red-500">
                        Ketgan: {formatDate(t.left_on)}
                        {t.leave_reason ? ` · ${t.leave_reason}` : ""}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{t.gender || "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{t.studentCount}</td>
                  <td className="px-4 py-3 text-ink-muted">{t.groupNames.length ? t.groupNames.join(", ") : "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{TEACHER_KIND_LABELS[t.kind]}</td>
                  <td className="px-4 py-3 text-ink-muted">{t.branchNames.length ? t.branchNames.join(", ") : "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{t.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(t)}
                        disabled={isPending}
                        className="rounded-lg p-1.5 text-brand-600 transition-colors hover:bg-canvas disabled:opacity-40"
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
                        className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40"
                        aria-label="O'chirish"
                        title="O'chirish"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={leaving !== null} onClose={() => setLeaving(null)} title="Xodimni nofaol qilish">
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">{leaving?.full_name}</p>
          <div>
            <label htmlFor="leave-date" className="mb-1.5 block text-sm font-medium text-ink-muted">
              Ketish sanasi
            </label>
            <input
              id="leave-date"
              type="date"
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
              className={financeInputClass}
            />
          </div>
          <div>
            <label htmlFor="leave-reason" className="mb-1.5 block text-sm font-medium text-ink-muted">
              Ketish sababi
            </label>
            <select
              id="leave-reason"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              className={financeInputClass}
            >
              {STAFF_LEAVE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setLeaving(null)}>
              Orqaga
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => {
                const target = leaving;
                if (!target) return;
                run(() => setTeacherActive(target.id, false, { date: leaveDate, reason: leaveReason }), () => setLeaving(null));
              }}
            >
              Saqlash
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
