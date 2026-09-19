"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPlatformAdmin } from "@/lib/auth/platform-admin";
import { ActionError, runAction } from "@/lib/actions/result";
import { fetchPlatformOrgs } from "@/lib/platform";

const DAY_MS = 86_400_000;

const planChangeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("extend"), days: z.union([z.literal(7), z.literal(14), z.literal(30)]) }),
  z.object({ kind: z.literal("activate") }),
  z.object({ kind: z.literal("expire") }),
]);

export type PlanChange = z.input<typeof planChangeSchema>;

/**
 * Maktab obunasini o'zgartiradi: sinovni uzaytirish, faollashtirish yoki
 * to'xtatish. Ruxsat bazadagi admin_set_plan ichida ham tekshiriladi.
 */
export async function setOrgPlan(orgId: string, change: PlanChange) {
  return runAction(async () => {
    const id = z.string().uuid().safeParse(orgId);
    const parsed = planChangeSchema.safeParse(change);
    if (!id.success || !parsed.success) throw new ActionError("Ma'lumotlar noto'g'ri");

    const { supabase } = await assertPlatformAdmin();
    const orgs = await fetchPlatformOrgs(supabase);
    const org = orgs.find((o) => o.id === id.data);
    if (!org) throw new ActionError("Maktab topilmadi");

    const c = parsed.data;
    let plan: "trial" | "active" | "expired";
    let trialEnds: string | null = null;

    if (c.kind === "extend") {
      // Muddati o'tgan bo'lsa bugundan, aks holda joriy tugash sanasidan boshlab uzaytiriladi.
      const current = org.trial_ends_at ? new Date(org.trial_ends_at).getTime() : 0;
      trialEnds = new Date(Math.max(Date.now(), current) + c.days * DAY_MS).toISOString();
      plan = "trial";
    } else if (c.kind === "activate") {
      plan = "active";
    } else {
      plan = "expired";
    }

    const { error } = await supabase.rpc("admin_set_plan", {
      p_org: id.data,
      p_plan: plan,
      p_trial_ends: trialEnds,
    });
    if (error) throw new ActionError("Obunani o'zgartirib bo'lmadi: " + error.message);

    revalidatePath("/admin");
    revalidatePath("/admin/organizations");
  });
}
