import { requirePermission } from "@/lib/auth/session";
import { termsFor } from "@/lib/segment";
import { ListPageShell } from "@/components/ui/ListPage";
import { BroadcastButton, type GroupOption } from "@/components/notifications/BroadcastButton";
import { NotificationLogList, type NotificationLogRow } from "@/components/notifications/NotificationLogList";

export default async function NotificationsPage() {
  const { supabase, org } = await requirePermission("notifications.manage");
  const terms = termsFor(org.type);

  const [{ data: groups }, { data: log, error }] = await Promise.all([
    supabase.from("groups").select("id, name").order("name"),
    supabase
      .from("notification_log")
      .select("id, kind, channel, message, success, created_at, student:students(full_name)")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <ListPageShell
      title="Eslatmalar"
      subtitle="Ota-onalarga yuborilgan xabarlar tarixi"
      actions={<BroadcastButton groups={(groups ?? []) as GroupOption[]} groupLabel={terms.group} />}
      notice={
        error
          ? "Bildirishnomalar tarixi bazada topilmadi — 0027_notifications.sql migratsiyasini Supabase SQL Editor&apos;da ishga tushiring."
          : undefined
      }
    >
      <div className="rounded-xl bg-canvas px-4 py-3 text-sm text-ink-muted">
        Davomat (kelmadi), qarzdorlik va to&apos;lov haqidagi xabarlar avtomatik yuboriladi va shu
        yerda ko&apos;rinadi. Ommaviy xabarni yuqoridagi tugma orqali qo&apos;lda yuborasiz.
      </div>

      <NotificationLogList items={(log ?? []) as unknown as NotificationLogRow[]} />
    </ListPageShell>
  );
}
