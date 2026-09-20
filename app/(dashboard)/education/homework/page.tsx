import { Inbox } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { HomeworkDeleteButton } from "@/components/homework/HomeworkDeleteButton";
import { NewHomeworkButton } from "@/components/homework/NewHomeworkButton";
import { InlineFilters, TablePager } from "@/components/ui/ListToolbar";
import { readPaging } from "@/lib/paging";
import { formatDate, todayIso } from "@/lib/utils/date";

const TH = "px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase";

interface HomeworkQueryRow {
  id: string;
  subject: string;
  kind?: string | null;
  title: string;
  details: string | null;
  due_on: string;
  max_score: number | null;
  created_at: string;
  group: { id: string; name: string; teacher: { full_name: string } | null } | null;
}

export default async function HomeworkPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePermission("homework.manage");
  const today = todayIso();

  // "Turi" ustuni (0073) alohida so'raladi: migratsiya qo'llanmagan bo'lsa ro'yxat baribir chiqadi.
  const kindsRes = await supabase.from("homework").select("id, kind");
  const kindById = new Map((kindsRes.error ? [] : (kindsRes.data ?? [])).map((k) => [k.id as string, k.kind as string]));

  const [homeworkRes, groupsRes, lessonsRes, coursesRes] = await Promise.all([
    supabase
      .from("homework")
      .select(
        "id, subject, title, details, due_on, max_score, created_at, " +
          "group:groups(id, name, teacher:teachers(full_name))",
      )
      .order("due_on", { ascending: false })
      .limit(1000),
    supabase.from("groups").select("id, name").order("name"),
    supabase.from("lessons").select("subject"),
    supabase.from("courses").select("name").order("name"),
  ]);

  const groups = groupsRes.data ?? [];
  const subjects = [
    ...new Set([
      ...(lessonsRes.data ?? []).map((l) => l.subject as string),
      ...(coursesRes.data ?? []).map((c) => c.name as string),
    ]),
  ].sort();

  const q = params.q?.trim().toLowerCase();
  const items = ((homeworkRes.data ?? []) as unknown as HomeworkQueryRow[]).filter((h) => {
    if (q && !`${h.title} ${h.subject}`.toLowerCase().includes(q)) return false;
    if (params.group && h.group?.id !== params.group) return false;
    if (params.state === "upcoming" && h.due_on < today) return false;
    if (params.state === "past" && h.due_on >= today) return false;
    return true;
  });

  const { page, size } = readPaging(params);
  const current = Math.min(page, Math.max(1, Math.ceil(items.length / size)));
  const offset = (current - 1) * size;
  const visible = items.slice(offset, offset + size);

  return (
    <div className="space-y-3">
      {homeworkRes.error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Vazifalar jadvali bazada topilmadi — 0034_teacher_cabinet.sql va 0042_group_module.sql
          migratsiyalarini Supabase SQL Editor&apos;da ishga tushiring.
        </p>
      )}

      <InlineFilters
        storageKey="homework"
        configurable={false}
        actions={
          groups.length > 0 ? (
            <NewHomeworkButton groups={groups} subjects={subjects} today={today} />
          ) : undefined
        }
        fields={[
          { name: "q", label: "Qidiruv", type: "text" },
          {
            name: "group",
            label: "Guruh",
            type: "select",
            options: groups.map((g) => ({ value: g.id, label: g.name })),
          },
          {
            name: "state",
            label: "Muddati",
            type: "select",
            options: [
              { value: "upcoming", label: "Yaqin muddatli" },
              { value: "past", label: "Muddati o'tgan" },
            ],
          },
        ]}
      />

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex justify-end px-4 py-3">
          <span className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink-muted">
            Umumiy soni <b className="ml-1 text-ink">{items.length}</b>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas">
              <tr>
                <th className={`${TH} w-12`}>№</th>
                <th className={TH}>Turi</th>
                <th className={TH}>Nomi</th>
                <th className={TH}>Topshirish muddati</th>
                <th className={TH}>O&apos;qituvchi</th>
                <th className={TH}>Guruh</th>
                <th className={TH}>Maksimal ball</th>
                <th className={TH}>Izoh</th>
                <th className={TH}>Yaratilgan sana</th>
                <th className={TH}>Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <Inbox size={22} className="mx-auto mb-2 text-ink-faint" aria-hidden="true" />
                    <div className="text-sm font-medium text-ink-muted">Ma&apos;lumotlar topilmadi</div>
                    <div className="mt-0.5 text-xs text-ink-faint">
                      Ma&apos;lumotlar topilmadi. Filterni o&apos;zgartirib ko&apos;ring.
                    </div>
                  </td>
                </tr>
              ) : (
                visible.map((h, i) => (
                  <tr key={h.id} className="hover:bg-canvas">
                    <td className="px-4 py-3 text-ink-faint">{offset + i + 1}</td>
                    <td className="px-4 py-3 text-ink-muted">{kindById.get(h.id) || "Uy vazifasi"}</td>
                    <td className="px-4 py-3 font-medium text-ink">{h.title}</td>
                    <td
                      className={`px-4 py-3 whitespace-nowrap ${
                        h.due_on < today ? "text-red-600" : "text-ink-muted"
                      }`}
                    >
                      {formatDate(h.due_on)}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{h.group?.teacher?.full_name ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">{h.group?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">{h.max_score ?? "—"}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-ink-muted">{h.details || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                      {formatDate(h.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <HomeworkDeleteButton homeworkId={h.id} title={h.title} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePager total={items.length} page={current} size={size} />
      </div>
    </div>
  );
}
