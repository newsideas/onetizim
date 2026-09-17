"use client";

import { useMemo, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FileText, Paperclip, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { useSegment } from "@/components/layout/SegmentProvider";
import type { ContractFormOptions, EditableContract } from "@/components/contracts/ContractsProvider";
import { createClient } from "@/lib/supabase/client";
import { createContract, updateContract } from "@/lib/actions/contracts";
import { formatSom } from "@/lib/utils/currency";
import {
  CONTRACT_FILES_BUCKET,
  CONTRACT_FILE_TYPES,
  calculateDiscount,
  contractFileError,
  type ContractInput,
} from "@/lib/validations/contract";

const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none disabled:opacity-60";

const EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-ink-muted">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

export function ContractFormModal({
  options,
  contract,
  onClose,
}: {
  options: ContractFormOptions;
  contract: EditableContract | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { terms } = useSegment();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const [studentId, setStudentId] = useState(contract?.student_id ?? "");
  const [contractNumber, setContractNumber] = useState(contract?.contract_number ?? "");
  const [contractTypeId, setContractTypeId] = useState(contract?.contract_type_id ?? "");
  const [academicYearId, setAcademicYearId] = useState(contract?.academic_year_id ?? "");
  const [discountId, setDiscountId] = useState(contract?.discount_id ?? "");
  const [baseAmount, setBaseAmount] = useState(contract ? String(contract.base_amount) : "");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [keepExistingFile, setKeepExistingFile] = useState(Boolean(contract?.file_path));

  const base = Number(baseAmount) || 0;
  const discount = options.discounts.find((d) => d.id === discountId) ?? null;
  const discountAmount = calculateDiscount(base, discount);

  const presets = useMemo(
    () =>
      options.amountPresets.filter(
        (p) => !academicYearId || !p.academic_year_id || p.academic_year_id === academicYearId,
      ),
    [options.amountPresets, academicYearId],
  );

  function resetFileInput() {
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function pickFile(file: File | undefined) {
    if (!file) return;
    const problem = contractFileError(file);
    resetFileInput();
    if (problem) {
      setError(problem);
      return;
    }
    setError(undefined);
    setNewFile(file);
    setKeepExistingFile(false);
  }

  function clearFile() {
    setNewFile(null);
    setKeepExistingFile(false);
    resetFileInput();
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);

    if (!studentId) return setError(`${terms.student}ni tanlang`);
    if (baseAmount.trim() === "" || !Number.isFinite(Number(baseAmount)) || base < 0) {
      return setError("Shartnoma summasini kiriting");
    }

    startTransition(async () => {
      const supabase = createClient();
      let uploadedPath: string | null = null;

      try {
        if (newFile) {
          setProgress("Fayl yuklanmoqda...");
          const path = `${options.orgId}/${crypto.randomUUID()}.${EXTENSIONS[newFile.type]}`;
          const { error: uploadError } = await supabase.storage
            .from(CONTRACT_FILES_BUCKET)
            .upload(path, newFile, { contentType: newFile.type, upsert: false });
          if (uploadError) throw new Error("Faylni yuklab bo'lmadi: " + uploadError.message);
          uploadedPath = path;
        }

        setProgress("Saqlanmoqda...");
        const keptPath = keepExistingFile ? (contract?.file_path ?? null) : null;
        const input: ContractInput = {
          studentId,
          contractNumber,
          contractTypeId,
          academicYearId,
          discountId,
          baseAmount: base,
          filePath: uploadedPath ?? keptPath,
          fileName: newFile ? newFile.name : keptPath ? (contract?.file_name ?? null) : null,
        };

        if (contract) await updateContract(contract.id, input);
        else await createContract(input);

        router.refresh();
        onClose();
      } catch (err) {
        if (uploadedPath) {
          await supabase.storage.from(CONTRACT_FILES_BUCKET).remove([uploadedPath]);
        }
        setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
      } finally {
        setProgress(null);
      }
    });
  }

  const shownFileName = newFile?.name ?? (keepExistingFile ? contract?.file_name || "Shartnoma fayli" : null);

  return (
    <Modal
      open
      onClose={isPending ? () => {} : onClose}
      title={contract ? "Shartnomani tahrirlash" : "Yangi shartnoma"}
    >
      <form onSubmit={submit} className="space-y-3">
        <Field label={terms.student} required>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={isPending}
            className={inputClass}
          >
            <option value="">Tanlang</option>
            {options.students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Shartnoma raqami">
            <input
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              maxLength={50}
              disabled={isPending}
              className={inputClass}
            />
          </Field>
          <Field label="Shartnoma turi">
            <select
              value={contractTypeId}
              onChange={(e) => setContractTypeId(e.target.value)}
              disabled={isPending}
              className={inputClass}
            >
              <option value="">Tanlang</option>
              {options.contractTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="O'quv yili">
            <select
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
              disabled={isPending}
              className={inputClass}
            >
              <option value="">Tanlang</option>
              {options.academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Summa shabloni">
            <select
              value=""
              onChange={(e) => {
                const preset = presets.find((p) => p.id === e.target.value);
                if (preset) setBaseAmount(String(preset.amount));
              }}
              disabled={isPending || presets.length === 0}
              className={inputClass}
            >
              <option value="">{presets.length === 0 ? "Shablon yo'q" : "Tanlang"}</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} — {formatSom(p.amount)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Shartnoma summasi" required>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={baseAmount}
              onChange={(e) => setBaseAmount(e.target.value)}
              disabled={isPending}
              className={inputClass}
            />
          </Field>
          <Field label="Chegirma">
            <select
              value={discountId}
              onChange={(e) => setDiscountId(e.target.value)}
              disabled={isPending}
              className={inputClass}
            >
              <option value="">Chegirmasiz</option>
              {options.discounts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="space-y-1 rounded-lg bg-canvas px-3 py-2.5 text-sm">
          {discountAmount > 0 && (
            <div className="flex justify-between text-ink-muted">
              <span>Chegirma</span>
              <span>− {formatSom(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-ink">
            <span>Yakuniy summa</span>
            <span>{formatSom(base - discountAmount)}</span>
          </div>
        </div>

        <Field label="Shartnoma fayli">
          {shownFileName ? (
            <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
              <FileText size={16} className="shrink-0 text-brand-600" />
              <span className="min-w-0 flex-1 truncate text-ink">{shownFileName}</span>
              <button
                type="button"
                onClick={clearFile}
                disabled={isPending}
                className="rounded p-1 text-ink-faint hover:bg-canvas hover:text-red-600"
                aria-label="Faylni olib tashlash"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line px-3 py-3 text-sm text-ink-muted transition-colors hover:border-brand-500 hover:text-brand-600"
            >
              <Paperclip size={15} />
              PDF yoki rasm tanlang (10 MB gacha)
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={CONTRACT_FILE_TYPES.join(",")}
            onChange={(e) => pickFile(e.target.files?.[0])}
            className="hidden"
          />
        </Field>

        <FormError message={error} />

        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={isPending}>
            {progress ?? "Saqlash"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
            Bekor qilish
          </Button>
        </div>
      </form>
    </Modal>
  );
}
