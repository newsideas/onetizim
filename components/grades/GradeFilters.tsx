"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export function GradeFilters({
  groups,
  groupId,
  subject,
  subjects,
  basePath = "/education/grades",
  hideSubject = false,
}: {
  groups: { id: string; name: string }[];
  groupId: string;
  subject: string;
  subjects: string[];
  /** Filtr qaysi sahifada ishlatilsa, o'sha yo'lga o'tadi. */
  basePath?: string;
  hideSubject?: boolean;
}) {
  const router = useRouter();

  function go(next: { group?: string; subject?: string }) {
    const params = new URLSearchParams({ group: next.group ?? groupId });
    const s = next.subject ?? subject;
    if (s) params.set("subject", s);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-4">
      <div className="w-56">
        <Label htmlFor="grade-group">Sinf</Label>
        <Select
          id="grade-group"
          value={groupId}
          onChange={(e) => go({ group: e.target.value, subject: "" })}
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </div>
      {!hideSubject && (
        <div className="w-56">
          <Label htmlFor="grade-subject">Fan</Label>
          <Input
            id="grade-subject"
            key={`${groupId}-${subject}`}
            list="grade-subject-options"
            placeholder="Barcha fanlar"
            defaultValue={subject}
            onBlur={(e) => {
              if (e.target.value.trim() !== subject)
                go({ subject: e.target.value.trim() });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                go({ subject: e.currentTarget.value.trim() });
            }}
          />
          <datalist id="grade-subject-options">
            {subjects.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      )}
    </div>
  );
}
