import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { ListPageShell } from "@/components/ui/ListPage";
import { NewParentButton } from "@/components/parents/NewParentButton";
import { ParentRowActions } from "@/components/parents/ParentRowActions";
import { formatSom } from "@/lib/utils/currency";
import { PageTabs } from "@/components/ui/PageTabs";
import { ParentsByStudent } from "@/components/parents/ParentsByStudent";
import { termsFor } from "@/lib/segment";

interface ChildRow {
  id: string;
  full_name: string;
  balance: number;
  group: { name: string } | null;
}

interface ParentRow {
  id: string;
  full_name: string;
  relation: string | null;
  phone: string | null;
  note: string | null;
  links: { student: ChildRow | null }[];
}

export default async function ParentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, org, permissions } = await requirePermission("students.view");
  const canManage = permissions.includes("students.manage");
  const byParent = params.view === "parents";

  const tabs = (
    <PageTabs
      tabs={[
        { label: "O'quvchilar bo'yicha", href: "/education/parents", active: !byParent },
        { label: "Ota-onalar", href: "/education/parents?view=parents", active: byParent },
      ]}
    />
  );

  const [parentsResult, { data: students }] = await Promise.all([
    supabase
      .from("parents")
      .select(
        "id, full_name, relation, phone, note, links:student_parents(student:students(id, full_name, balance, group:groups(name)))",
      )
      .order("full_name"),
    supabase.from("students").select("id, full_name").order("full_name"),
  ]);

  // Supabase'ning TS inferi join'ni massiv deb hisoblaydi; many-to-one uchun
  // PostgREST yakka obyekt qaytaradi.
  const parents = (parentsResult.data ?? []) as unknown as ParentRow[];
  const studentOptions = (students ?? []) as { id: string; full_name: string }[];

  if (!byParent) {
    return (
      <ParentsByStudent
        supabase={supabase}
        params={params}
        tabs={tabs}
        studentLabel={termsFor(org.type).student}
        actions={canManage ? <NewParentButton students={studentOptions} /> : undefined}
      />
    );
  }

  return (
    <ListPageShell
      title="Ota-onalar"
      subtitle="Ota-onalar va ularning farzandlari"
      tabs={tabs}
      actions={canManage ? <NewParentButton students={studentOptions} /> : undefined}
      notice={
        parentsResult.error
          ? "Ota-onalar jadvali bazada topilmadi — 0030_parents.sql migratsiyasini Supabase SQL Editor&apos;da ishga tushiring."
          : undefined
      }
    >
      {parents.length === 0 ? (
        <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
          Hali ota-ona kiritilmagan.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-canvas text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">F.I.Sh.</th>
                <th className="px-4 py-3 font-medium">Telefon</th>
                <th className="px-4 py-3 font-medium">Farzandlari</th>
                <th className="px-4 py-3 font-medium">Qarzdorlik</th>
                {canManage && <th className="px-4 py-3 font-medium">Amallar</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {parents.map((p) => {
                const children = p.links.map((l) => l.student).filter((s): s is ChildRow => !!s);
                const debt = children.reduce((sum, c) => sum + (c.balance < 0 ? -c.balance : 0), 0);
                return (
                  <tr key={p.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="text-ink">{p.full_name}</div>
                      {p.relation && <div className="text-xs text-ink-faint">{p.relation}</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">{p.phone || "—"}</td>
                    <td className="px-4 py-3">
                      {children.length === 0 ? (
                        <span className="text-ink-faint">—</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {children.map((c) => (
                            <li key={c.id}>
                              <Link
                                href={`/education/students/${c.id}`}
                                className="text-brand-600 hover:underline"
                              >
                                {c.full_name}
                              </Link>
                              {c.group?.name && (
                                <span className="text-xs text-ink-faint"> · {c.group.name}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {debt > 0 ? (
                        <span className="font-medium text-red-500">{formatSom(debt)}</span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <ParentRowActions
                          parent={{
                            id: p.id,
                            fullName: p.full_name,
                            relation: p.relation ?? "",
                            phone: p.phone ?? "",
                            note: p.note ?? "",
                            studentIds: children.map((c) => c.id),
                          }}
                          students={studentOptions}
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ListPageShell>
  );
}
