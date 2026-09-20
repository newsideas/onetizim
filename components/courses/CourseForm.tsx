"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { saveCourse } from "@/lib/actions/courses";
import { unwrap } from "@/lib/actions/result";
import { referencePath } from "@/lib/references";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export interface BranchPriceRow {
  branchId: string;
  name: string;
  available: boolean;
  price: string;
}

const LIST_PATH = referencePath("subjects");

/** Edu tizimdagi kurs formasi: kurs nomi, rang va filiallar bo'yicha "bitta dars narxi". */
export function CourseForm({
  courseId,
  initialTitle = "",
  initialColor = "#000000",
  branches,
}: {
  courseId?: string;
  initialTitle?: string;
  initialColor?: string;
  branches: BranchPriceRow[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [color, setColor] = useState(initialColor);
  const [rows, setRows] = useState(branches);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  function update(branchId: string, patch: Partial<BranchPriceRow>) {
    setRows((list) => list.map((r) => (r.branchId === branchId ? { ...r, ...patch } : r)));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSaving(true);
    try {
      unwrap(
        await saveCourse(courseId ?? null, {
          title,
          color,
          prices: rows.map((r) => ({
            branchId: r.branchId,
            available: r.available,
            price: r.price === "" ? 0 : Number(r.price),
          })),
        }),
      );
      router.push(LIST_PATH);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="flex flex-wrap items-start gap-6 rounded-xl border border-line bg-surface p-5">
        <div className="w-64">
          <Label htmlFor="course-title">Kurs nomi</Label>
          <Input id="course-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="w-60">
          <Label htmlFor="course-color">Rang</Label>
          <input
            id="course-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-[42px] w-full cursor-pointer rounded-lg border border-line bg-canvas p-1.5"
          />
        </div>
      </div>

      <p className="text-sm text-ink">Shu dars o&apos;qitiladigan filiallarni tanlang va bitta dars narxini kiriting</p>

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line">
            <tr>
              <th className="w-32 px-4 py-3 text-center font-semibold text-ink">Mavjudligi</th>
              <th className="px-4 py-3 font-semibold text-ink">Filiallar</th>
              <th className="w-56 px-4 py-3 font-semibold text-ink">Bitta dars narxi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-ink-muted">
                  Filiallar hali qo&apos;shilmagan.{" "}
                  <Link href={referencePath("branches")} className="text-brand-600 hover:underline">
                    Filial qo&apos;shish
                  </Link>
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.branchId}>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      aria-label={r.name}
                      checked={r.available}
                      onChange={(e) => update(r.branchId, { available: e.target.checked })}
                      className="h-4 w-4 rounded border-line accent-brand-600"
                    />
                  </td>
                  <td className="px-4 py-3 text-ink">{r.name}</td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      disabled={!r.available}
                      value={r.price}
                      onChange={(e) => update(r.branchId, { price: e.target.value })}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <FormError message={error} />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => router.push(LIST_PATH)}>
          Orqaga
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </form>
  );
}
