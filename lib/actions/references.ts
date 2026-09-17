"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import {
  getReference,
  isReferenceKey,
  referencePath,
  type ReferenceKey,
  type RefField,
} from "@/lib/references";

/**
 * Ma'lumotnomalar uchun umumiy CRUD.
 *
 * `key` faqat `lib/references.ts`dagi ro'yxatdan tekshiriladi — brauzer
 * ixtiyoriy jadval yoki ustun nomi yubora olmaydi. Har bir maydon o'z
 * turiga qarab tozalanadi (raqam, sana, mantiqiy) va bo'sh majburiy
 * maydon bo'lsa xatolik qaytariladi.
 */

function coerceValue(field: RefField, raw: FormDataEntryValue | null): unknown {
  if (field.type === "boolean") return raw === "on" || raw === "true";

  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) return null;

  if (field.type === "number") {
    const n = Number(text);
    return Number.isFinite(n) ? n : null;
  }

  return text;
}

function buildRow(key: ReferenceKey, formData: FormData): Record<string, unknown> {
  const config = getReference(key);
  const row: Record<string, unknown> = {};

  for (const field of config.fields) {
    const value = coerceValue(field, formData.get(field.name));

    if (field.required && (value === null || value === "")) {
      throw new Error(`"${field.label}" to'ldirilishi shart`);
    }

    row[field.name] = value;
  }

  return row;
}

function assertReferenceKey(key: string): asserts key is ReferenceKey {
  if (!isReferenceKey(key)) throw new Error("Noma'lum ma'lumotnoma: " + key);
}

export async function createReferenceItem(key: string, formData: FormData) {
  assertReferenceKey(key);
  const config = getReference(key);
  const row = buildRow(key, formData);

  const { supabase, org } = await assertPermission("settings.manage");
  const orgId = org.id;

  const { error } = await supabase.from(config.table).insert({ org_id: orgId, ...row });

  if (error) {
    throw new Error(
      error.code === "23505"
        ? "Bu yozuv allaqachon mavjud"
        : "Saqlashda xatolik: " + error.message,
    );
  }

  revalidatePath(referencePath(key));
}

export async function updateReferenceItem(key: string, id: string, formData: FormData) {
  assertReferenceKey(key);
  const config = getReference(key);
  const row = buildRow(key, formData);

  const { supabase } = await assertPermission("settings.manage");
  const { error } = await supabase.from(config.table).update(row).eq("id", id);

  if (error) {
    throw new Error(
      error.code === "23505"
        ? "Bu yozuv allaqachon mavjud"
        : "Yangilashda xatolik: " + error.message,
    );
  }

  revalidatePath(referencePath(key));
}

export async function deleteReferenceItem(key: string, id: string) {
  assertReferenceKey(key);
  const config = getReference(key);

  const { supabase } = await assertPermission("settings.manage");
  const { error } = await supabase.from(config.table).delete().eq("id", id);

  if (error) throw new Error("O'chirishda xatolik: " + error.message);

  revalidatePath(referencePath(key));
}
