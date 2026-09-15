"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { GroupForm } from "@/components/groups/GroupForm";
import { useSegment } from "@/components/layout/SegmentProvider";

export function NewGroupButton() {
  const [open, setOpen] = useState(false);
  const { terms } = useSegment();

  return (
    <>
      <Button onClick={() => setOpen(true)} className="inline-flex items-center gap-2">
        <Plus size={16} /> {terms.newGroup}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title={`${terms.newGroup} qo'shish`}>
        <GroupForm onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}
