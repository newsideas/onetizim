import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .max(max, "Matn juda uzun")
    .nullish()
    .transform((v) => (v && v.trim() ? v.trim() : null));

export const roomSchema = z.object({
  name: z.string().trim().min(1, "Xona nomini kiriting").max(60, "Nom juda uzun"),
  capacity: z
    .number({ message: "Sig'im raqam bo'lishi kerak" })
    .int("Sig'im butun son bo'lishi kerak")
    .min(0, "Sig'im manfiy bo'lishi mumkin emas")
    .max(10000, "Sig'im juda katta")
    .nullish()
    .transform((v) => v ?? null),
  responsibleId: z
    .string()
    .nullish()
    .transform((v) => v || null)
    .pipe(z.string().uuid("Mas'ul shaxs noto'g'ri").nullable()),
  note: optionalText(500),
});

export type RoomInput = z.input<typeof roomSchema>;

export const equipmentSchema = z.object({
  name: z.string().trim().min(1, "Jihoz nomini kiriting").max(100, "Nom juda uzun"),
  /** Bo'sh qoldirilsa bazada avtomatik yaratiladi (INV-00001). */
  inventoryCode: optionalText(40),
  unitPrice: z
    .number({ message: "Narx raqam bo'lishi kerak" })
    .min(0, "Narx manfiy bo'lishi mumkin emas")
    .max(1e10, "Narx juda katta"),
});

export type EquipmentInput = z.input<typeof equipmentSchema>;

export const roomEquipmentSchema = z.object({
  roomId: z.string().uuid("Xona noto'g'ri"),
  items: z
    .array(
      z.object({
        equipmentId: z.string().uuid("Jihoz noto'g'ri"),
        quantity: z
          .number({ message: "Soni raqam bo'lishi kerak" })
          .int("Soni butun son bo'lishi kerak")
          .min(1, "Soni kamida 1 bo'lishi kerak")
          .max(100000, "Soni juda katta"),
      }),
    )
    .max(200, "Jihozlar soni juda ko'p"),
});

export type RoomEquipmentInput = z.input<typeof roomEquipmentSchema>;
