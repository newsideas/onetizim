"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { setStudentDiscount } from "@/lib/actions/student-discount";
import { DISCOUNT_REASONS, discountedPrice } from "@/lib/discounts";
import { formatSom } from "@/lib/utils/currency";

const SIBLING_REASON = DISCOUNT_REASONS[0];

/**
 * O'quvchi chegirmasi: foiz va sabab, sinf narxidan keyingi oylik to'lov.
 * Ota-ona telefoni bir xil bo'lgan boshqa o'quvchilar (aka-uka) topilsa — tavsiya ko'rsatiladi.
 */
export function StudentDiscountCard({
  studentId,
  percent: initialPercent,
  reason: initialReason,
  monthlyPrice,
  siblings,
  canManage,
}: {
  studentId: string;
  percent: number;
  reason: string | null;
  /** Sinf/guruhning oylik narxi (0 — narx belgilanmagan). */
  monthlyPrice: number;
  siblings: { id: string; full_name: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [percent, setPercent] = useState(String(initialPercent));
  const [reason, setReason] = useState(initialReason ?? "");
  const [error, setError] = useState<string>();

  function save(nextPercent: number, nextReason: string | null) {
    setError(undefined);
    startTransition(async () => {
      const result = await setStudentDiscount(studentId, nextPercent, nextReason);
      if (!result.ok) return setError(result.error);
      setEditing(false);
      router.refresh();
    });
  }

  function pickReason(label: string) {
    setReason(label);
    if (!label) return setPercent("0");
    const preset = DISCOUNT_REASONS.find((r) => r.label === label);
    if (preset && preset.percent > 0) setPercent(String(preset.percent));
  }

  const suggestSibling = canManage && siblings.length > 0 && initialPercent === 0;
  const previewPercent = Math.min(100, Math.max(0, Number(percent) || 0));

  return (
    <div className="space-y-3 rounded-xl border border-line p-4 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-wide text-ink-faint uppercase">Chegirma</h2>
        {canManage && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            O&apos;zgartirish
          </button>
        )}
      </div>

      {editing ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            save(Number(percent) || 0, reason || null);
          }}
        >
          <div>
            <Label htmlFor="discount-reason">Sababi</Label>
            <Select
              id="discount-reason"
              value={reason}
              onChange={(e) => pickReason(e.target.value)}
              disabled={isPending}
            >
              <option value="">Chegirmasiz</option>
              {DISCOUNT_REASONS.map((r) => (
                <option key={r.label} value={r.label}>
                  {r.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="discount-percent">Foiz (%)</Label>
            <Input
              id="discount-percent"
              type="number"
              min={0}
              max={100}
              step={1}
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              disabled={isPending}
            />
          </div>
          {monthlyPrice > 0 && (
            <p className="text-xs text-ink-muted">
              Oylik to&apos;lov: {formatSom(discountedPrice(monthlyPrice, previewPercent))}
            </p>
          )}
          <FormError message={error} />
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)} disabled={isPending}>
              Bekor qilish
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex justify-between gap-3">
            <span className="text-ink-faint">Chegirma</span>
            <span className="text-right font-medium text-ink">
              {initialPercent > 0 ? `${initialPercent}% · ${initialReason ?? ""}` : "Yo'q"}
            </span>
          </div>
          {monthlyPrice > 0 && (
            <div className="flex justify-between">
              <span className="text-ink-faint">Oylik to&apos;lov</span>
              <span className="text-ink">
                {initialPercent > 0 && (
                  <span className="mr-1.5 text-xs text-ink-faint line-through">{formatSom(monthlyPrice)}</span>
                )}
                {formatSom(discountedPrice(monthlyPrice, initialPercent))}
              </span>
            </div>
          )}
          <FormError message={error} />
        </>
      )}

      {siblings.length > 0 && (
        <div className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-ink-muted dark:bg-brand-500/10">
          <div>
            Aka-uka (ota-ona telefoni bir xil):{" "}
            {siblings.map((s, i) => (
              <span key={s.id}>
                {i > 0 && ", "}
                <Link href={`/education/students/${s.id}`} className="font-medium text-brand-600 hover:underline">
                  {s.full_name}
                </Link>
              </span>
            ))}
          </div>
          {suggestSibling && !editing && (
            <button
              type="button"
              onClick={() => save(SIBLING_REASON.percent, SIBLING_REASON.label)}
              disabled={isPending}
              className="mt-1.5 font-medium text-brand-600 hover:underline disabled:opacity-50"
            >
              {SIBLING_REASON.percent}% aka-uka chegirmasini qo&apos;llash
            </button>
          )}
        </div>
      )}
    </div>
  );
}
