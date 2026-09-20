"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { HomeworkForm } from "@/components/homework/HomeworkForm";

/** «Barcha vazifalar» sahifasidagi «Vazifa qo'shish» tugmasi va uning oynasi. */
export function NewHomeworkButton({
  groups,
  subjects,
  today,
}: {
  groups: { id: string; name: string }[];
  subjects: string[];
  today: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus size={15} aria-hidden="true" />
        Vazifa qo&apos;shish
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Vazifa qo'shish">
        <HomeworkForm
          groups={groups}
          subjects={subjects}
          defaultSubject=""
          today={today}
          onSaved={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
