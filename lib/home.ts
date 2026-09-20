import type { SupabaseClient } from "@supabase/supabase-js";
import { monthStartIso, toIsoDay, todayIso } from "@/lib/utils/date";
import { CLOSED_LEAD_STAGES, type LeadStage } from "@/lib/validations/lead";

/**
 * Bosh sahifadagi 12 ta ko'rsatkich (Edu tizimdagi rangli kartalar).
 * Sahifa faqat chizish bilan shug'ullanadi.
 */

export interface HomeStats {
  orders: number;
  firstLesson: number;
  newStudents: number;
  activeStudents: number;
  lostOrders: number;
  leftNew: number;
  leftActive: number;
  debtors: number;
  groups: number;
  firstPayers: number;
  frozen: number;
  archived: number;
  /** archived_at ustuni (0041 migratsiya) topilmasa — ketganlar kartalari 0 chiqadi. */
  archiveDateMissing: boolean;
}

/** O'quvchi shu kundan keyin arxivlansa "yangi o'quvchidan ketgan" hisoblanadi. */
const NEW_STUDENT_DAYS = 30;

function dayDiff(from: string, to: string): number {
  return (Date.parse(to) - Date.parse(from)) / 86_400_000;
}

export async function getHomeStats(supabase: SupabaseClient): Promise<HomeStats> {
  const today = todayIso();
  const monthStart = monthStartIso();

  const [studentsRes, archivedRes, leadsRes, groupsRes, monthPaymentsRes] = await Promise.all([
    supabase.from("students").select("status, balance, created_at"),
    supabase.from("students").select("created_at, archived_at").eq("status", "archived"),
    supabase.from("leads").select("stage, trial_date"),
    supabase.from("groups").select("id", { count: "exact", head: true }),
    supabase.from("payments").select("student_id").gte("paid_at", monthStart),
  ]);

  const students = (studentsRes.data ?? []) as {
    status: string;
    balance: number;
    created_at: string;
  }[];
  const active = students.filter((s) => s.status === "active");

  const leads = (leadsRes.data ?? []) as { stage: LeadStage; trial_date: string | null }[];
  const openLeads = leads.filter((l) => !CLOSED_LEAD_STAGES.includes(l.stage));

  // Ketganlar: arxivlangan o'quvchi qancha vaqt o'qigani bo'yicha ikkiga bo'linadi.
  const archiveDateMissing = archivedRes.error !== null;
  const archivedRows = (archivedRes.data ?? []) as {
    created_at: string;
    archived_at: string | null;
  }[];
  const studiedDays = (s: { created_at: string; archived_at: string | null }) =>
    s.archived_at ? dayDiff(toIsoDay(s.created_at), toIsoDay(s.archived_at)) : null;
  const leftNew = archivedRows.filter((s) => {
    const days = studiedDays(s);
    return days !== null && days <= NEW_STUDENT_DAYS;
  }).length;
  const leftActive = archivedRows.filter((s) => {
    const days = studiedDays(s);
    return days !== null && days > NEW_STUDENT_DAYS;
  }).length;

  // Birinchi to'lovni qilganlar: shu oy to'lagan, oldin hech to'lamaganlar.
  const paidThisMonth = [
    ...new Set(
      ((monthPaymentsRes.data ?? []) as { student_id: string }[]).map((p) => p.student_id),
    ),
  ];
  let firstPayers = paidThisMonth.length;
  if (paidThisMonth.length > 0) {
    const { data: earlier } = await supabase
      .from("payments")
      .select("student_id")
      .in("student_id", paidThisMonth)
      .lt("paid_at", monthStart);
    const paidBefore = new Set(
      ((earlier ?? []) as { student_id: string }[]).map((p) => p.student_id),
    );
    firstPayers = paidThisMonth.filter((id) => !paidBefore.has(id)).length;
  }

  return {
    orders: openLeads.length,
    firstLesson: openLeads.filter((l) => l.trial_date && l.trial_date >= today).length,
    newStudents: active.filter((s) => s.created_at.slice(0, 10) >= monthStart).length,
    activeStudents: active.length,
    lostOrders: leads.filter((l) => l.stage === "lost").length,
    leftNew,
    leftActive,
    debtors: active.filter((s) => Number(s.balance) < 0).length,
    groups: groupsRes.count ?? 0,
    firstPayers,
    frozen: students.filter((s) => s.status === "frozen").length,
    archived: students.filter((s) => s.status === "archived").length,
    archiveDateMissing,
  };
}
