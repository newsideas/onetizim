"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { GroupForm } from "@/components/groups/GroupForm";
import type { GroupInput } from "@/lib/validations/group";

export function EditGroupButton({
  groupId,
  defaultValues,
}: {
  groupId: string;
  defaultValues: Partial<GroupInput>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2"
      >
        <Pencil size={16} /> Tahrirlash
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Guruhni tahrirlash">
        <GroupForm
          groupId={groupId}
          defaultValues={defaultValues}
          onSuccess={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
