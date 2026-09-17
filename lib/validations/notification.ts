import { z } from "zod";

export const broadcastSchema = z
  .object({
    audience: z.enum(["all", "group"], { message: "Qabul qiluvchilarni tanlang" }),
    groupId: z.string().optional(),
    message: z.string().trim().min(3, "Xabar matnini kiriting").max(1000, "Xabar juda uzun"),
  })
  .refine((v) => v.audience !== "group" || !!v.groupId, {
    message: "Guruhni tanlang",
    path: ["groupId"],
  });

export type BroadcastInput = z.input<typeof broadcastSchema>;
