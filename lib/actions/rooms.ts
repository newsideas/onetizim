"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import { ActionError, runAction } from "@/lib/actions/result";
import {
  equipmentSchema,
  roomEquipmentSchema,
  roomSchema,
  type EquipmentInput,
  type RoomEquipmentInput,
  type RoomInput,
} from "@/lib/validations/room";

/** Postgres unique buzilishi. */
const UNIQUE_VIOLATION = "23505";

function revalidateRooms() {
  revalidatePath("/education/rooms");
  revalidatePath("/education/equipment");
  revalidatePath("/education/schedule");
  revalidatePath("/education/groups");
}

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri";
}

// ---------------------------------------------------------------- Xonalar

export async function createRoom(input: RoomInput) {
  return runAction(async () => {
    const parsed = roomSchema.safeParse(input);
    if (!parsed.success) throw new ActionError(firstIssue(parsed.error));
    const v = parsed.data;

    const { supabase, org } = await assertPermission("groups.manage");
    const { error } = await supabase.from("rooms").insert({
      org_id: org.id,
      name: v.name,
      capacity: v.capacity,
      responsible_id: v.responsibleId,
      note: v.note,
    });
    if (error) {
      throw new ActionError(
        error.code === UNIQUE_VIOLATION
          ? "Bunday nomli xona allaqachon bor"
          : "Xonani saqlab bo'lmadi: " + error.message,
      );
    }
    revalidateRooms();
  });
}

export async function updateRoom(roomId: string, input: RoomInput) {
  return runAction(async () => {
    const parsed = roomSchema.safeParse(input);
    if (!parsed.success) throw new ActionError(firstIssue(parsed.error));
    const v = parsed.data;

    const { supabase } = await assertPermission("groups.manage");
    // RLS xonani faqat o'z tashkilotida o'zgartirishga ruxsat beradi; 0 satr — ruxsat yo'q yoki topilmadi.
    const { data, error } = await supabase
      .from("rooms")
      .update({
        name: v.name,
        capacity: v.capacity,
        responsible_id: v.responsibleId,
        note: v.note,
      })
      .eq("id", roomId)
      .select("id");
    if (error) {
      throw new ActionError(
        error.code === UNIQUE_VIOLATION
          ? "Bunday nomli xona allaqachon bor"
          : "Xonani yangilab bo'lmadi: " + error.message,
      );
    }
    if (!data?.length) throw new ActionError("Xona topilmadi yoki ruxsat yo'q");
    revalidateRooms();
  });
}

export async function deleteRoom(roomId: string) {
  return runAction(async () => {
    const { supabase } = await assertPermission("groups.manage");
    const { data, error } = await supabase.from("rooms").delete().eq("id", roomId).select("id");
    if (error) throw new ActionError("Xonani o'chirib bo'lmadi: " + error.message);
    if (!data?.length) throw new ActionError("Xona topilmadi yoki ruxsat yo'q");
    revalidateRooms();
  });
}

/** Xonadagi jihozlar to'plamini to'liq almashtiradi (yo'qolganlari o'chiriladi). */
export async function setRoomEquipment(input: RoomEquipmentInput) {
  return runAction(async () => {
    const parsed = roomEquipmentSchema.safeParse(input);
    if (!parsed.success) throw new ActionError(firstIssue(parsed.error));
    const { roomId, items } = parsed.data;

    const ids = items.map((i) => i.equipmentId);
    if (new Set(ids).size !== ids.length) throw new ActionError("Bir jihoz ikki marta tanlangan");

    const { supabase, org } = await assertPermission("groups.manage");

    const { data: existing, error: readError } = await supabase
      .from("room_equipment")
      .select("equipment_id")
      .eq("room_id", roomId);
    if (readError) throw new ActionError("Jihozlarni o'qib bo'lmadi: " + readError.message);

    const removed = (existing ?? [])
      .map((r) => r.equipment_id as string)
      .filter((id) => !ids.includes(id));
    if (removed.length > 0) {
      const { error } = await supabase
        .from("room_equipment")
        .delete()
        .eq("room_id", roomId)
        .in("equipment_id", removed);
      if (error) throw new ActionError("Jihozni olib tashlab bo'lmadi: " + error.message);
    }

    if (items.length > 0) {
      const { error } = await supabase.from("room_equipment").upsert(
        items.map((i) => ({
          org_id: org.id,
          room_id: roomId,
          equipment_id: i.equipmentId,
          quantity: i.quantity,
        })),
        { onConflict: "room_id,equipment_id" },
      );
      if (error) throw new ActionError("Jihozlarni saqlab bo'lmadi: " + error.message);
    }
    revalidateRooms();
  });
}

// ---------------------------------------------------------------- Jihozlar

export async function createEquipment(input: EquipmentInput) {
  return runAction(async () => {
    const parsed = equipmentSchema.safeParse(input);
    if (!parsed.success) throw new ActionError(firstIssue(parsed.error));
    const v = parsed.data;

    const { supabase, org } = await assertPermission("groups.manage");
    const { error } = await supabase.from("equipment").insert({
      org_id: org.id,
      name: v.name,
      unit_price: v.unitPrice,
      // Kod berilmasa ustun umuman yuborilmaydi — bazadagi default INV-xxxxx yaratadi.
      ...(v.inventoryCode ? { inventory_code: v.inventoryCode } : {}),
    });
    if (error) {
      throw new ActionError(
        error.code === UNIQUE_VIOLATION
          ? "Bu inventar kodi band"
          : "Jihozni saqlab bo'lmadi: " + error.message,
      );
    }
    revalidateRooms();
  });
}

export async function updateEquipment(equipmentId: string, input: EquipmentInput) {
  return runAction(async () => {
    const parsed = equipmentSchema.safeParse(input);
    if (!parsed.success) throw new ActionError(firstIssue(parsed.error));
    const v = parsed.data;

    const { supabase } = await assertPermission("groups.manage");
    const { data, error } = await supabase
      .from("equipment")
      .update({
        name: v.name,
        unit_price: v.unitPrice,
        ...(v.inventoryCode ? { inventory_code: v.inventoryCode } : {}),
      })
      .eq("id", equipmentId)
      .select("id");
    if (error) {
      throw new ActionError(
        error.code === UNIQUE_VIOLATION
          ? "Bu inventar kodi band"
          : "Jihozni yangilab bo'lmadi: " + error.message,
      );
    }
    if (!data?.length) throw new ActionError("Jihoz topilmadi yoki ruxsat yo'q");
    revalidateRooms();
  });
}

export async function deleteEquipment(equipmentId: string) {
  return runAction(async () => {
    const { supabase } = await assertPermission("groups.manage");
    const { data, error } = await supabase
      .from("equipment")
      .delete()
      .eq("id", equipmentId)
      .select("id");
    if (error) throw new ActionError("Jihozni o'chirib bo'lmadi: " + error.message);
    if (!data?.length) throw new ActionError("Jihoz topilmadi yoki ruxsat yo'q");
    revalidateRooms();
  });
}
