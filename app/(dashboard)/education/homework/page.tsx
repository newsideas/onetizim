import { requirePermission } from "@/lib/auth/session";
import { GradeFilters } from "@/components/grades/GradeFilters";
import { HomeworkForm } from "@/components/homework/HomeworkForm";
import { HomeworkDeleteButton } from "@/components/homework/HomeworkDeleteButton";
import { formatDate, todayIso } from "@/lib/utils/date";

interface HomeworkRow {
  id: string;
  subject: string;
  title: string;
  details: string | null;
  due_on: string;
}

export default async function HomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePermission("homework.manage");
  const { data: groups } = await supabase.from("groups").select("id, name").order("name");

  if (!groups || groups.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-ink">Uy vazifalari</h1>
        <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
          Sizga biriktirilgan sinf yo&apos;q.
        </div>
      </div>
    );
  }

  const groupId =
    params.group && groups.some((g) => g.id === params.group) ? params.group : groups[0].id;
  const today = todayIso();

  const [homeworkResult, { data: lessons }, { data: courses }] = await Promise.all([
    supabase
      .from("homework")
      .select("id, subject, title, details, due_on")
      .eq("group_id", groupId)
      .order("due_on", { ascending: false })
      .limit(100),
    supabase.from("lessons").select("subject").eq("group_id", groupId),
    supabase.from("courses").select("name").order("name"),
  ]);

  const rows = (homeworkResult.data ?? []) as HomeworkRow[];
  const subjects = [
    ...new Set([
      ...(lessons ?? []).map((l) => l.subject as string),
      ...(courses ?? []).map((c) => c.name as string),
    ]),
  ].sort();

  const upcoming = rows.filter((r) => r.due_on >= today).sort((a, b) => a.due_on.localeCompare(b.due_on));
  const past = rows.filter((r) => r.due_on < today);

  function renderRows(list: HomeworkRow[]) {
    return (
      <ul className="divide-y divide-line rounded-xl border border-line">
        {list.map((r) => (
          <li key={r.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-medium text-ink">
                {r.title} <span className="font-normal text-ink-faint">· {r.subject}</span>
              </div>
              {r.details && <p className="mt-0.5 text-sm text-ink-muted">{r.details}</p>}
              <p className="mt-1 text-xs text-ink-faint">Topshirish: {formatDate(r.due_on)}</p>
            </div>
            <HomeworkDeleteButton homeworkId={r.id} title={r.title} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink">Uy vazifalari</h1>

      {homeworkResult.error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Uy vazifalari jadvali bazada topilmadi — 0034_teacher_cabinet.sql migratsiyasini Supabase
          SQL Editor&apos;da ishga tushiring.
        </p>
      )}

      <GradeFilters
        groups={groups}
        groupId={groupId}
        subject=""
        subjects={[]}
        basePath="/education/homework"
        hideSubject
      />

      <HomeworkForm
        key={groupId}
        groupId={groupId}
        subjects={subjects}
        defaultSubject=""
        today={today}
      />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-ink-muted">Yaqin muddatli vazifalar</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-line p-6 text-center text-sm text-ink-faint">
            Hozircha vazifa yo&apos;q.
          </div>
        ) : (
          renderRows(upcoming)
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-ink-muted">Muddati o&apos;tgan</h2>
          {renderRows(past)}
        </section>
      )}
    </div>
  );
}
