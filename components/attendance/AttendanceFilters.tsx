"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

interface GroupOption {
  id: string;
  name: string;
}

export function AttendanceFilters({
  groups,
  groupId,
  date,
}: {
  groups: GroupOption[];
  groupId: string;
  date: string;
}) {
  const router = useRouter();

  function updateParams(next: { group?: string; date?: string }) {
    const params = new URLSearchParams({
      group: next.group ?? groupId,
      date: next.date ?? date,
    });
    router.push(`/education/attendance?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-4">
      <div className="w-56">
        <Label htmlFor="attendance-group">Guruh</Label>
        <Select
          id="attendance-group"
          value={groupId}
          onChange={(e) => updateParams({ group: e.target.value })}
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-44">
        <Label htmlFor="attendance-date">Sana</Label>
        <Input
          id="attendance-date"
          type="date"
          value={date}
          onChange={(e) => updateParams({ date: e.target.value })}
        />
      </div>
    </div>
  );
}
