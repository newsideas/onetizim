"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { unwrap } from "@/lib/actions/result";
import { getGroupFormOptions, type GroupFormOptions } from "@/lib/actions/groups";
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
  const [options, setOptions] = useState<GroupFormOptions | null>(null);

  // Kurslar, o'qituvchilar va xonalar ro'yxati oyna birinchi ochilganda bir marta yuklanadi.
  useEffect(() => {
    if (!open || options) return;
    getGroupFormOptions()
      .then((result) => setOptions(unwrap(result)))
      .catch(() => setOptions({ courses: [], teachers: [], rooms: [] }));
  }, [open, options]);

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
        {/* Ro'yxatlar yuklanguncha forma ochilmaydi, shunda joriy tanlovlar to'g'ri ko'rinadi. */}
        {options ? (
          <GroupForm
            groupId={groupId}
            defaultValues={defaultValues}
            options={options}
            onSuccess={() => setOpen(false)}
          />
        ) : (
          <p className="py-6 text-center text-sm text-ink-faint">Yuklanmoqda...</p>
        )}
      </Modal>
    </>
  );
}
