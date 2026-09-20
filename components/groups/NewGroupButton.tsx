"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { unwrap } from "@/lib/actions/result";
import { getGroupFormOptions, type GroupFormOptions } from "@/lib/actions/groups";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { GroupForm } from "@/components/groups/GroupForm";
import { useSegment } from "@/components/layout/SegmentProvider";

export function NewGroupButton() {
  const searchParams = useSearchParams();
  // Header'dagi "+" menyusi /settings/classes?new=1 ga o'tadi — modal darhol ochilsin.
  const [open, setOpen] = useState(() => searchParams.get("new") === "1");
  const [options, setOptions] = useState<GroupFormOptions | null>(null);
  const { terms } = useSegment();

  // Kurslar, o'qituvchilar va xonalar ro'yxati oyna birinchi ochilganda bir marta yuklanadi.
  useEffect(() => {
    if (!open || options) return;
    getGroupFormOptions()
      .then((result) => setOptions(unwrap(result)))
      .catch(() => setOptions({ courses: [], teachers: [], rooms: [] }));
  }, [open, options]);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="inline-flex items-center gap-2">
        <Plus size={16} /> Qo&apos;shish
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={`${terms.newGroup} qo'shish`}>
        <GroupForm onSuccess={() => setOpen(false)} options={options ?? undefined} />
      </Modal>
    </>
  );
}
