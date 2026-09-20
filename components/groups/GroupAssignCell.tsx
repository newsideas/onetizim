"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { assignStudentGroup } from "@/lib/actions/students";

/** Qatordagi o'quvchini boshqa guruhga tez ko'chirish: tanlov + saqlash. */
export function GroupAssignCell({
  studentId,
  currentGroupId,
  groups,
}: {
  studentId: string;
  currentGroupId: string | null;
  groups: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState(currentGroupId ?? "");
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  const changed = selected !== "" && selected !== (currentGroupId ?? "");

  function save() {
    setError(undefined);
    startTransition(async () => {
      const result = await assignStudentGroup(studentId, selected);
      if (!result.ok) return setError(result.error);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Guruhni tanlang"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-40 rounded-lg border border-line bg-surface px-2 py-1.5 text-[13px] text-ink"
      >
        <option value="">Tanlang</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={save}
        disabled={!changed || isPending}
        aria-label="Saqlash"
        title="Saqlash"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:bg-line disabled:text-ink-faint"
      >
        <Check size={15} />
      </button>
      {saved && <span className="text-xs text-green-600">Saqlandi</span>}
      {error && <span className="max-w-[160px] text-xs text-red-600">{error}</span>}
    </div>
  );
}
