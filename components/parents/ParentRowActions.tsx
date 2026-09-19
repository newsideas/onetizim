"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { ConfirmActionButton } from "@/components/ui/ConfirmActionButton";
import {
  ParentFormModal,
  type ParentFormValues,
  type StudentOption,
} from "@/components/parents/ParentFormModal";
import { deleteParent } from "@/lib/actions/parents";

export function ParentRowActions({
  parent,
  students,
}: {
  parent: ParentFormValues;
  students: StudentOption[];
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Tahrirlash"
        title="Tahrirlash"
        className="rounded p-1 text-ink-faint transition-colors hover:bg-line hover:text-ink"
      >
        <Pencil size={14} aria-hidden="true" />
      </button>
      <ConfirmActionButton
        action={() => deleteParent(parent.id)}
        confirmText={`"${parent.fullName}" ota-onasini o'chirmoqchimisiz? Farzandlar o'chmaydi.`}
      />
      {editing && (
        <ParentFormModal students={students} parent={parent} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}
