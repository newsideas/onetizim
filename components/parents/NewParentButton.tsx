"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ParentFormModal, type StudentOption } from "@/components/parents/ParentFormModal";

export function NewParentButton({ students }: { students: StudentOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus size={16} aria-hidden="true" />
        Ota-ona qo&apos;shish
      </Button>
      {open && <ParentFormModal students={students} onClose={() => setOpen(false)} />}
    </>
  );
}
