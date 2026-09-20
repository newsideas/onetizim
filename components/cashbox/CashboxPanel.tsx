"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { createCashbox, createTransfer, updateCashbox } from "@/lib/actions/cashboxes";
import { unwrap } from "@/lib/actions/result";
import { formatSom } from "@/lib/utils/currency";
import { todayIso } from "@/lib/utils/date";
import { METHOD_LABELS, PAYMENT_WINDOW_METHODS } from "@/lib/validations/payment";
import { NewExpenseButton } from "@/components/finance/FinanceButtons";
import { NewPaymentButton } from "@/components/payments/NewPaymentButton";
import type { StudentOption } from "@/components/payments/PaymentForm";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";

export interface CashboxView {
  id: string;
  name: string;
  moderatorId: string | null;
  moderatorName: string | null;
  acceptsOnline: boolean;
  isArchived: boolean;
  balance: number;
}

export interface ModeratorOption {
  id: string;
  full_name: string;
}

// ---------------------------------------------------------------- Kassa formasi

function CashboxForm({
  cashbox,
  moderators,
  onDone,
}: {
  cashbox?: CashboxView;
  moderators: ModeratorOption[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(cashbox?.name ?? "");
  const [moderatorId, setModeratorId] = useState(cashbox?.moderatorId ?? "");
  const [acceptsOnline, setAcceptsOnline] = useState(cashbox?.acceptsOnline ?? false);
  const [isArchived, setIsArchived] = useState(cashbox?.isArchived ?? false);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSaving(true);
    try {
      const input = { name, moderatorId, acceptsOnline, isArchived };
      unwrap(cashbox ? await updateCashbox(cashbox.id, input) : await createCashbox(input));
      router.refresh();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div>
        <Label htmlFor="cb-name">Ism</Label>
        <Input id="cb-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} disabled={saving} />
      </div>
      <div>
        <Label htmlFor="cb-moderator">Moderator</Label>
        <Select id="cb-moderator" value={moderatorId} onChange={(e) => setModeratorId(e.target.value)} disabled={saving}>
          <option value="">Tanlang</option>
          {moderators.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </Select>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={acceptsOnline}
          onChange={(e) => setAcceptsOnline(e.target.checked)}
          className="h-4 w-4 rounded border-line"
        />
        Onlayn to&apos;lov qabul qiladi
      </label>
      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={isArchived}
          onChange={(e) => setIsArchived(e.target.checked)}
          className="h-4 w-4 rounded border-line"
        />
        Kassani arxiv qilish
      </label>

      <FormError message={error} />

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onDone} disabled={saving}>
          Orqaga
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </form>
  );
}

/** Edu tizimdagi "Yangi kassa qo'shish" tugmasi va paneli. */
export function NewCashboxButton({ moderators }: { moderators: ModeratorOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className="inline-flex w-full items-center gap-2">
        <Plus size={15} aria-hidden="true" /> Yangi kassa qo&apos;shish
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Yangi kassa qo'shish" tone="brand">
        <CashboxForm moderators={moderators} onDone={() => setOpen(false)} />
      </Drawer>
    </>
  );
}

// ---------------------------------------------------------------- Ko'chirish

function TransferForm({
  from,
  targets,
  onDone,
}: {
  from: CashboxView;
  targets: { id: string; name: string }[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [toCashboxId, setToCashboxId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!toCashboxId) return setError("Moliya bo'limini tanlang");
    if (!amount || Number(amount) <= 0) return setError("Summani kiriting");
    if (!method) return setError("To'lov turini tanlang");

    setSaving(true);
    try {
      unwrap(
        await createTransfer({
          fromCashboxId: from.id,
          toCashboxId,
          amount: Number(amount),
          method: method as (typeof PAYMENT_WINDOW_METHODS)[number],
          date,
          note,
        }),
      );
      router.refresh();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div>
        <Label htmlFor="tr-to">Moliya bo&apos;limi</Label>
        <Select id="tr-to" value={toCashboxId} onChange={(e) => setToCashboxId(e.target.value)} disabled={saving}>
          <option value="">Tanlang</option>
          {targets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        {targets.length === 0 && (
          <p className="mt-1 text-xs text-ink-faint">Ko&apos;chirish uchun avval yana bitta kassa qo&apos;shing.</p>
        )}
      </div>
      <div>
        <Label htmlFor="tr-amount">Qiymat</Label>
        <Input
          id="tr-amount"
          type="number"
          min={0}
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={saving}
        />
      </div>
      <div>
        <Label htmlFor="tr-method">To&apos;lov turi</Label>
        <Select id="tr-method" value={method} onChange={(e) => setMethod(e.target.value)} disabled={saving}>
          <option value="">Tanlang</option>
          {PAYMENT_WINDOW_METHODS.map((m) => (
            <option key={m} value={m}>
              {METHOD_LABELS[m]}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="tr-date">Sanani tanlang</Label>
        <Input id="tr-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={saving} />
      </div>
      <div>
        <Label htmlFor="tr-note">Izoh</Label>
        <Input id="tr-note" value={note} onChange={(e) => setNote(e.target.value)} disabled={saving} />
      </div>

      <FormError message={error} />

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onDone} disabled={saving}>
          Orqaga
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- Kassa kartasi

const CARD_BUTTON =
  "inline-flex w-full items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90";

/** Edu tizimdagi kassa kartasi: nom, qoldiq, moderator va Kirim / Chiqim / Ko'chirish tugmalari. */
export function CashboxCard({
  cashbox,
  href,
  selected,
  students,
  moderators,
  otherCashboxes,
}: {
  cashbox: CashboxView;
  href: string;
  selected: boolean;
  students: StudentOption[];
  moderators: ModeratorOption[];
  otherCashboxes: { id: string; name: string }[];
}) {
  const [mode, setMode] = useState<"edit" | "transfer" | null>(null);
  const close = () => setMode(null);

  return (
    <div
      className={`rounded-xl bg-brand-700 p-4 text-white shadow-sm ${
        selected ? "ring-2 ring-brand-400 ring-offset-2 ring-offset-canvas" : ""
      } ${cashbox.isArchived ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={href} className="block truncate text-sm font-semibold hover:underline">
            {cashbox.name}
          </Link>
          <div className={`mt-1 text-lg font-bold ${cashbox.balance < 0 ? "text-red-200" : ""}`}>
            {formatSom(cashbox.balance)}
          </div>
          <div className="mt-1 truncate text-xs text-white/80">{cashbox.moderatorName ?? "Moderator tanlanmagan"}</div>
          <button
            type="button"
            onClick={() => setMode("edit")}
            className="mt-3 rounded-full bg-white/15 p-1.5 hover:bg-white/25"
            aria-label="Kassani tahrirlash"
            title="Tahrirlash"
          >
            <Pencil size={13} />
          </button>
        </div>
        <div className="flex w-28 shrink-0 flex-col gap-1.5">
          <NewPaymentButton
            students={students}
            cashboxId={cashbox.id}
            label="Kirim"
            className={`${CARD_BUTTON} bg-green-600`}
          />
          <NewExpenseButton cashboxId={cashbox.id} className={`${CARD_BUTTON} bg-red-500`} />
          <button type="button" onClick={() => setMode("transfer")} className={`${CARD_BUTTON} bg-sky-500`}>
            Ko&apos;chirish
          </button>
        </div>
      </div>

      <Drawer open={mode === "edit"} onClose={close} title="Kassani tahrirlash" tone="brand">
        <CashboxForm cashbox={cashbox} moderators={moderators} onDone={close} />
      </Drawer>
      <Drawer open={mode === "transfer"} onClose={close} title="Ko'chirish" tone="brand">
        <TransferForm from={cashbox} targets={otherCashboxes} onDone={close} />
      </Drawer>
    </div>
  );
}
