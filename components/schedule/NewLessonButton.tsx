"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LessonFormModal, type LessonOptions } from "@/components/schedule/LessonFormModal";

export function NewLessonButton({ options }: { options: LessonOptions }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus size={16} aria-hidden="true" />
        Dars qo&apos;shish
      </Button>
      {open && <LessonFormModal options={options} onClose={() => setOpen(false)} />}
    </>
  );
}
