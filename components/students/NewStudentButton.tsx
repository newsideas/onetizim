"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StudentForm, type GroupOption } from "@/components/students/StudentForm";
import { useSegment } from "@/components/layout/SegmentProvider";

export function NewStudentButton({ groups }: { groups: GroupOption[] }) {
  const [open, setOpen] = useState(false);
  const { terms } = useSegment();

  return (
    <>
      <Button onClick={() => setOpen(true)} className="inline-flex items-center gap-2">
        <Plus size={16} /> {terms.newStudent}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={`${terms.newStudent} qo'shish`}>
        {groups.length === 0 ? (
          <p className="text-sm text-white/60">
            Avval kamida bitta {terms.group.toLowerCase()} yarating, keyin
            {terms.student.toLowerCase()} qo&apos;shishingiz mumkin.
          </p>
        ) : (
          <StudentForm groups={groups} onSuccess={() => setOpen(false)} />
        )}
      </Modal>
    </>
  );
}
