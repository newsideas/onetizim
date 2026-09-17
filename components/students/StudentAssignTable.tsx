"use client";

import { unwrap } from "@/lib/actions/result";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { assignStudentGroup } from "@/lib/actions/students";
import { formatDate } from "@/lib/utils/date";

export interface AssignRow {
  id: string;
  full_name: string;
  group_id: string | null;
  group_name: string | null;
  created_at: string;
}

export interface GroupOption {
  id: string;
  name: string;
}

/**
 * "O'quvchini biriktirish" jadvali — har bir qatorda tanlov + saqlash,
 * to'liq tahrirlash formasini ochmasdan sinf/guruhni tez almashtirish
 * uchun.
 */
export function StudentAssignTable({
  rows,
  groupLabel,
  groups,
}: {
  rows: AssignRow[];
  groupLabel: string;
  groups: GroupOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  function save(studentId: string) {
    const groupId = selected[studentId];
    if (!groupId) return;

    setErrorId(null);
    startTransition(async () => {
      try {
        unwrap(await assignStudentGroup(studentId, groupId));
        setSavedId(studentId);
        router.refresh();
        setTimeout(() => setSavedId((id) => (id === studentId ? null : id)), 1500);
      } catch {
        setErrorId(studentId);
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-canvas">
            <tr>
              <th className="w-12 px-4 py-3 text-xs font-semibold text-ink-muted">#</th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                FISH
              </th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                {groupLabel}
              </th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Yaratilgan sana
              </th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Amallar
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-ink-faint">
                  Hech qanday ma&apos;lumot topilmadi
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const currentValue = selected[row.id] ?? row.group_id ?? "";
                const changed = currentValue && currentValue !== (row.group_id ?? "");

                return (
                  <tr key={row.id} className="hover:bg-canvas">
                    <td className="px-4 py-3 text-ink-faint">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-ink">{row.full_name}</td>
                    <td className="px-4 py-3">
                      <select
                        value={currentValue}
                        onChange={(e) =>
                          setSelected((prev) => ({ ...prev, [row.id]: e.target.value }))
                        }
                        className="w-full max-w-[200px] rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
                      >
                        <option value="">Biriktirilmagan</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3">
                      {errorId === row.id ? (
                        <span className="text-xs text-red-600">Xatolik</span>
                      ) : savedId === row.id ? (
                        <span className="inline-flex items-center gap-1 text-xs text-brand-600">
                          <Check size={14} /> Saqlandi
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!changed || isPending}
                          onClick={() => save(row.id)}
                          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-600/40"
                        >
                          Saqlash
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-line px-4 py-2.5 text-xs text-ink-faint">
        {rows.length === 0 ? "0-0" : `1-${rows.length}`} / Jami: {rows.length}
      </div>
    </div>
  );
}
