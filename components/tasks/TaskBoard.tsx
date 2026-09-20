"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock, Pencil, Plus, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { createTask, deleteTask, setTaskDone, updateTask } from "@/lib/actions/tasks";
import { TASK_TYPES, TASK_TYPE_LABELS, type TaskType } from "@/lib/validations/task";
import { formatDate } from "@/lib/utils/date";

export interface TaskRow {
  id: string;
  due_date: string;
  due_time: string | null;
  task_type: TaskType;
  assignee_id: string | null;
  note: string | null;
  done_at: string | null;
}

export interface StaffOption {
  id: string;
  full_name: string;
}

function TaskForm({
  task,
  staff,
  today,
  onDone,
}: {
  task?: TaskRow;
  staff: StaffOption[];
  today: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [dueDate, setDueDate] = useState(task?.due_date ?? today);
  const [dueTime, setDueTime] = useState(task?.due_time?.slice(0, 5) ?? "");
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id ?? "");
  const [taskType, setTaskType] = useState<TaskType>(task?.task_type ?? "other");
  const [note, setNote] = useState(task?.note ?? "");

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    const input = { dueDate, dueTime: dueTime || null, taskType, assigneeId: assigneeId || null, note };
    startTransition(async () => {
      const result = task ? await updateTask(task.id, input) : await createTask(input);
      if (!result.ok) return setError(result.error);
      router.refresh();
      onDone();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="task-date">Sana</Label>
          <Input id="task-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="task-time">Vaqt</Label>
          <Input id="task-time" type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="task-assignee">Xodim</Label>
          <Select id="task-assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Tanlang</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="task-type">Topshiriq turi</Label>
          <Select id="task-type" value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)}>
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>
                {TASK_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="task-note">Izoh</Label>
        <Input id="task-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
      </div>
      <FormError message={error} />
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onDone}>
          Orqaga
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </form>
  );
}

export function NewTaskButton({ staff, today }: { staff: StaffOption[]; today: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus size={15} aria-hidden="true" />
        Qo&apos;shish
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Topshiriq">
        <TaskForm staff={staff} today={today} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function TaskCard({
  task,
  staffName,
  canManage,
  staff,
  today,
}: {
  task: TaskRow;
  staffName: string | null;
  canManage: boolean;
  staff: StaffOption[];
  today: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string>();
  const done = Boolean(task.done_at);

  function toggleDone() {
    setError(undefined);
    startTransition(async () => {
      const result = await setTaskDone(task.id, !done);
      if (!result.ok) return setError(result.error);
      router.refresh();
    });
  }

  return (
    <div
      className={`rounded-xl border border-line bg-surface p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${
        done ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-ink">{TASK_TYPE_LABELS[task.task_type]}</div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
            <Clock size={12} aria-hidden="true" />
            {formatDate(task.due_date)}
            {task.due_time ? ` · ${task.due_time.slice(0, 5)}` : ""}
          </div>
        </div>
        {canManage && (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={toggleDone}
              disabled={isPending}
              aria-label={done ? "Qaytarish" : "Bajarildi"}
              title={done ? "Qaytarish" : "Bajarildi"}
              className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-canvas hover:text-brand-600 disabled:opacity-40"
            >
              {done ? <Undo2 size={15} /> : <Check size={15} />}
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Tahrirlash"
              title="Tahrirlash"
              className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-canvas hover:text-ink"
            >
              <Pencil size={15} />
            </button>
            <ConfirmActionButton
              action={() => deleteTask(task.id)}
              confirmText="Topshiriqni o'chirmoqchimisiz?"
            />
          </div>
        )}
      </div>
      {task.note && <p className="mt-2 text-sm text-ink-muted">{task.note}</p>}
      {staffName && <div className="mt-2 text-xs text-ink-faint">{staffName}</div>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      <Modal open={editing} onClose={() => setEditing(false)} title="Topshiriqni tahrirlash">
        <TaskForm task={task} staff={staff} today={today} onDone={() => setEditing(false)} />
      </Modal>
    </div>
  );
}

const COLUMNS = [
  { key: "overdue", title: "O'tib ketgan", bar: "border-red-500" },
  { key: "today", title: "Bugun", bar: "border-green-500" },
  { key: "tomorrow", title: "Ertaga", bar: "border-sky-500" },
  { key: "later", title: "Keyinroq", bar: "border-brand-500" },
] as const;

/** Topshiriqlar doskasi: muddatiga qarab ustunlarga bo'lingan (Edu tizimdagi kabi). */
export function TaskBoard({
  tasks,
  staff,
  canManage,
  today,
  tomorrow,
}: {
  tasks: TaskRow[];
  staff: StaffOption[];
  canManage: boolean;
  /** Toshkent bo'yicha bugun va ertaga (YYYY-MM-DD) — server hisoblaydi. */
  today: string;
  tomorrow: string;
}) {
  const [showDone, setShowDone] = useState(false);
  const staffName = useMemo(() => new Map(staff.map((s) => [s.id, s.full_name])), [staff]);

  const open = tasks.filter((t) => !t.done_at);
  const done = tasks.filter((t) => t.done_at);

  const grouped: Record<(typeof COLUMNS)[number]["key"], TaskRow[]> = {
    overdue: open.filter((t) => t.due_date < today),
    today: open.filter((t) => t.due_date === today),
    tomorrow: open.filter((t) => t.due_date === tomorrow),
    later: open.filter((t) => t.due_date > tomorrow),
  };

  const time = (t: TaskRow) => `${t.due_date} ${t.due_time ?? "00:00"}`;

  return (
    <div className="space-y-3">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = [...grouped[col.key]].sort((a, b) => time(a).localeCompare(time(b)));
          return (
            <section key={col.key}>
              <header className={`border-t-2 pt-2 text-center ${col.bar}`}>
                <div className="text-sm font-semibold tracking-wide text-ink uppercase">{col.title}</div>
                <div className="text-sm text-ink-faint">{items.length}</div>
              </header>
              <div className="mt-3 space-y-2">
                {items.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    staffName={t.assignee_id ? (staffName.get(t.assignee_id) ?? null) : null}
                    canManage={canManage}
                    staff={staff}
                    today={today}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {done.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="text-sm text-brand-600 hover:underline"
          >
            {showDone ? "Bajarilganlarni yashirish" : `Bajarilganlar (${done.length})`}
          </button>
          {showDone && (
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {done.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  staffName={t.assignee_id ? (staffName.get(t.assignee_id) ?? null) : null}
                  canManage={canManage}
                  staff={staff}
                  today={today}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
