import { requirePermission } from "@/lib/auth/session";
import { GradeFilters } from "@/components/grades/GradeFilters";
import { GradeJournal } from "@/components/grades/GradeJournal";
import { GradeChip } from "@/components/grades/GradeChip";
import { formatDate, todayIso } from "@/lib/utils/date";
import {
  GRADE_KIND_LABELS,
  averageScore,
  type GradeKind,
} from "@/lib/validations/grade";

interface GradeRow {
  id: string;
  student_id: string;
  subject: string;
  kind: GradeKind;
  score: number;
  graded_on: string;
}

/** Bir o'quvchi qatorida ko'rsatiladigan oxirgi baholar soni. */
const RECENT_LIMIT = 15;

export default async function GradesPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; subject?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePermission("grades.manage");
  const { data: groups } = await supabase.from("groups").select("id, name").order("name");

  if (!groups || groups.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-ink">Baholar</h1>
        <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
          Avval kamida bitta sinf yarating.
        </div>
      </div>
    );
  }

  const groupId =
    params.group && groups.some((g) => g.id === params.group) ? params.group : groups[0].id;
  const subject = (params.subject ?? "").trim();

  let gradesQuery = supabase
    .from("grades")
    .select("id, student_id, subject, kind, score, graded_on")
    .eq("group_id", groupId)
    .order("graded_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(2000);
  if (subject) gradesQuery = gradesQuery.eq("subject", subject);

  const [{ data: students }, gradesResult, { data: lessons }, { data: courses }] =
    await Promise.all([
      supabase
        .from("students")
        .select("id, full_name")
        .eq("group_id", groupId)
        .eq("status", "active")
        .order("full_name"),
      gradesQuery,
      supabase.from("lessons").select("subject").eq("group_id", groupId),
      supabase.from("courses").select("name").order("name"),
    ]);

  const studentList = students ?? [];
  const grades = (gradesResult.data ?? []) as GradeRow[];

  const subjects = [
    ...new Set([
      ...(lessons ?? []).map((l) => l.subject as string),
      ...(courses ?? []).map((c) => c.name as string),
      ...grades.map((g) => g.subject),
    ]),
  ].sort();

  const gradesByStudent = new Map<string, GradeRow[]>();
  for (const g of grades) {
    const list = gradesByStudent.get(g.student_id) ?? [];
    list.push(g);
    gradesByStudent.set(g.student_id, list);
  }

  function subjectAverages(list: GradeRow[]) {
    const bySubject = new Map<string, number[]>();
    for (const g of list) bySubject.set(g.subject, [...(bySubject.get(g.subject) ?? []), g.score]);
    return [...bySubject.entries()]
      .map(([name, scores]) => `${name} ${averageScore(scores)}`)
      .join(" · ");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink">Baholar</h1>

      {gradesResult.error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Baholar jadvali bazada topilmadi — 0029_grades.sql migratsiyasini Supabase SQL
          Editor&apos;da ishga tushiring.
        </p>
      )}

      <GradeFilters groups={groups} groupId={groupId} subject={subject} subjects={subjects} />

      {studentList.length === 0 ? (
        <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
          Bu sinfda aktiv o&apos;quvchi yo&apos;q.
        </div>
      ) : (
        <>
          <GradeJournal
            key={`${groupId}-${subject}`}
            groupId={groupId}
            students={studentList as { id: string; full_name: string }[]}
            subject={subject}
            subjects={subjects}
            today={todayIso()}
          />

          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-canvas text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">O&apos;quvchi</th>
                  <th className="px-4 py-3 font-medium">O&apos;rtacha</th>
                  <th className="px-4 py-3 font-medium">
                    Baholar{subject ? ` — ${subject}` : ""}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {studentList.map((s) => {
                  const list = gradesByStudent.get(s.id) ?? [];
                  const avg = averageScore(list.map((g) => g.score));
                  return (
                    <tr key={s.id} className="align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-ink">{s.full_name}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink">{avg ?? "—"}</div>
                        {!subject && list.length > 0 && (
                          <div className="mt-0.5 max-w-xs text-xs text-ink-faint">
                            {subjectAverages(list)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {list.length === 0 ? (
                          <span className="text-ink-faint">Hali baho yo&apos;q</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {list.slice(0, RECENT_LIMIT).map((g) => (
                              <GradeChip
                                key={g.id}
                                id={g.id}
                                score={g.score}
                                title={`${g.subject} · ${GRADE_KIND_LABELS[g.kind]} · ${formatDate(g.graded_on)}`}
                              />
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
