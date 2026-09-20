import { requirePermission } from "@/lib/auth/session";
import { InlineFilters, type InlineField } from "@/components/ui/ListToolbar";
import { NewTaskButton, TaskBoard, type TaskRow } from "@/components/tasks/TaskBoard";
import { TASK_TYPES, TASK_TYPE_LABELS } from "@/lib/validations/task";
import { todayIso } from "@/lib/utils/date";

/** Sana (YYYY-MM-DD) + n kun. */
function addDays(isoDay: string, n: number): string {
  const [y, m, d] = isoDay.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, permissions } = await requirePermission("dashboard.view");
  const canManage = permissions.includes("leads.manage");

  const today = todayIso();
  const tomorrow = addDays(today, 1);

  let query = supabase
    .from("tasks")
    .select("id, due_date, due_time, task_type, assignee_id, note, done_at")
    .order("due_date")
    .order("due_time", { nullsFirst: true });

  if (params.assignee) query = query.eq("assignee_id", params.assignee);
  if (params.type) query = query.eq("task_type", params.type);

  const [tasksRes, staffRes] = await Promise.all([
    query,
    supabase.from("teachers").select("id, full_name").order("full_name"),
  ]);

  const staff = (staffRes.data ?? []) as { id: string; full_name: string }[];

  const fields: InlineField[] = [
    {
      name: "assignee",
      label: "Xodim",
      type: "select",
      options: staff.map((s) => ({ value: s.id, label: s.full_name })),
    },
    {
      name: "type",
      label: "Topshiriq turi",
      type: "select",
      options: TASK_TYPES.map((t) => ({ value: t, label: TASK_TYPE_LABELS[t] })),
    },
  ];

  return (
    <div className="space-y-4">
      {tasksRes.error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Topshiriqlar jadvali bazada topilmadi — 0044_tasks.sql migratsiyasini Supabase SQL
          Editor&apos;da ishga tushiring.
        </p>
      )}

      <InlineFilters
        storageKey="tasks"
        configurable={false}
        actions={canManage ? <NewTaskButton staff={staff} today={today} /> : undefined}
        fields={fields}
      />

      <TaskBoard
        tasks={(tasksRes.data ?? []) as TaskRow[]}
        staff={staff}
        canManage={canManage}
        today={today}
        tomorrow={tomorrow}
      />
    </div>
  );
}
