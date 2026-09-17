"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { financeInputClass } from "@/components/finance/MoneyEntryModal";
import { createStaffInvite } from "@/lib/actions/staff";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { INVITABLE_ROLES } from "@/lib/validations/staff";

export interface TeacherOption {
  id: string;
  full_name: string;
}

export function InviteStaffButton({ employees }: { employees: TeacherOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [link, setLink] = useState<string>();
  const [copied, setCopied] = useState(false);

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<(typeof INVITABLE_ROLES)[number]>("teacher");
  const [employeeId, setEmployeeId] = useState("");

  function close() {
    setOpen(false);
    setFullName("");
    setRole("teacher");
    setEmployeeId("");
    setError(undefined);
    setLink(undefined);
    setCopied(false);
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (fullName.trim().length < 2) return setError("Ism familiyani kiriting");

    setError(undefined);
    startTransition(async () => {
      const result = await createStaffInvite({ fullName, role, employeeId });
      if (!result.ok) return setError(result.error);
      setLink(`${window.location.origin}/invite/${result.data}`);
      router.refresh();
    });
  }

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
      >
        <UserPlus size={16} aria-hidden="true" />
        Xodimni taklif qilish
      </button>

      {open && (
        <Modal open onClose={isPending ? () => {} : close} title="Xodimni taklif qilish">
          {link ? (
            <div className="space-y-3">
              <p className="text-sm text-ink-muted">
                Havolani xodimga yuboring. Xodim shu havola orqali ro&apos;yxatdan o&apos;tadi va
                jamoaga qo&apos;shiladi.
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{link}</span>
                <button
                  type="button"
                  onClick={copyLink}
                  className="shrink-0 rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-ink"
                  aria-label="Havolani nusxalash"
                >
                  {copied ? <Check size={15} className="text-brand-600" /> : <Copy size={15} />}
                </button>
              </div>
              <Button type="button" variant="secondary" onClick={close}>
                Yopish
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label htmlFor="invite-name" className="mb-1.5 block text-xs font-medium text-ink-muted">
                  Ism familiya <span className="text-red-500">*</span>
                </label>
                <input
                  id="invite-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={120}
                  autoFocus
                  disabled={isPending}
                  className={financeInputClass}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="invite-role" className="mb-1.5 block text-xs font-medium text-ink-muted">
                    Rol
                  </label>
                  <select
                    id="invite-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as (typeof INVITABLE_ROLES)[number])}
                    disabled={isPending}
                    className={financeInputClass}
                  >
                    {INVITABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="invite-employee" className="mb-1.5 block text-xs font-medium text-ink-muted">
                    Xodim kartasi
                  </label>
                  <select
                    id="invite-employee"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    disabled={isPending}
                    className={financeInputClass}
                  >
                    <option value="">Bog&apos;lanmagan</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <FormError message={error} />

              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Yaratilmoqda..." : "Havola yaratish"}
                </Button>
                <Button type="button" variant="secondary" onClick={close} disabled={isPending}>
                  Bekor qilish
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
