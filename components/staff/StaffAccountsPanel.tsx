"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { createStaffAccount, resetStaffPassword } from "@/lib/actions/staff-accounts";
import { ROLE_LABELS } from "@/lib/auth/permissions";

export interface EmployeeOption {
  id: string;
  full_name: string;
}

type AccountRole = "manager" | "teacher" | "accountant";

/** O'quv menejeri faqat o'qituvchi hisobini yaratadi; direktor hammasini. */
export function NewAccountButton({
  employees,
  roles,
}: {
  employees: EmployeeOption[];
  roles: AccountRole[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [created, setCreated] = useState<{ login: string; password: string } | null>(null);

  const [fullName, setFullName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AccountRole>(roles[0] ?? "teacher");
  const [employeeId, setEmployeeId] = useState("");

  function close() {
    setOpen(false);
    setError(undefined);
    setCreated(null);
    setFullName("");
    setLogin("");
    setPassword("");
    setEmployeeId("");
  }

  function pickEmployee(id: string) {
    setEmployeeId(id);
    const emp = employees.find((e) => e.id === id);
    if (emp && !fullName) setFullName(emp.full_name);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await createStaffAccount({
        fullName,
        login,
        password,
        role,
        employeeId: employeeId || null,
      });
      if (!result.ok) return setError(result.error);
      setCreated({ login: result.data.login, password });
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus size={15} aria-hidden="true" />
        Hisob yaratish
      </Button>
      <Modal open={open} onClose={close} title="Xodimga login va parol berish">
        {created ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-muted">
              Hisob ochildi. Login va parolni xodimga o&apos;zingiz yetkazing — parol qayta ko&apos;rsatilmaydi.
            </p>
            <dl className="space-y-2 rounded-lg bg-canvas p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Login</dt>
                <dd className="font-medium text-ink">{created.login}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Parol</dt>
                <dd className="font-medium text-ink">{created.password}</dd>
              </div>
            </dl>
            <div className="flex justify-end">
              <Button type="button" onClick={close}>
                Yopish
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3" noValidate>
            <div>
              <Label htmlFor="acc-employee">Xodim kartasi</Label>
              <Select id="acc-employee" value={employeeId} onChange={(e) => pickEmployee(e.target.value)}>
                <option value="">Yangi xodim (karta avtomatik ochiladi)</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="acc-name">F.I.Sh.</Label>
              <Input id="acc-name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} />
            </div>
            <div>
              <Label htmlFor="acc-login">Login (telefon raqam yoki nom)</Label>
              <Input
                id="acc-login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="+998 90 123 45 67 yoki aziz.karimov"
                autoComplete="off"
                maxLength={40}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="acc-password">Parol</Label>
                <Input
                  id="acc-password"
                  type="text"
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kamida 6 ta belgi"
                />
              </div>
              <div>
                <Label htmlFor="acc-role">Rol</Label>
                <Select id="acc-role" value={role} onChange={(e) => setRole(e.target.value as AccountRole)}>
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <FormError message={error} />
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={close}>
                Orqaga
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Yaratilmoqda..." : "Hisob yaratish"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

export function ResetPasswordButton({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);

  function close() {
    setOpen(false);
    setError(undefined);
    setPassword("");
    setDone(false);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await resetStaffPassword(userId, { password });
      if (!result.ok) return setError(result.error);
      setDone(true);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
      >
        <KeyRound size={13} aria-hidden="true" />
        Parolni yangilash
      </button>
      <Modal open={open} onClose={close} title={`${name} — yangi parol`}>
        {done ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-muted">
              Parol yangilandi. Yangi parol: <b className="text-ink">{password}</b> — uni xodimga o&apos;zingiz
              yetkazing.
            </p>
            <div className="flex justify-end">
              <Button type="button" onClick={close}>
                Yopish
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3" noValidate>
            <div>
              <Label htmlFor="reset-password">Yangi parol</Label>
              <Input
                id="reset-password"
                type="text"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 6 ta belgi"
              />
            </div>
            <FormError message={error} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={close}>
                Orqaga
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
