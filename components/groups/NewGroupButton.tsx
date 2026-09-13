"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { GroupForm } from "@/components/groups/GroupForm";

export function NewGroupButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="inline-flex items-center gap-2">
        <Plus size={16} /> Yangi guruh
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Yangi guruh qo'shish">
        <GroupForm onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}
