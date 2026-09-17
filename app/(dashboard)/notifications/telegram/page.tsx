import { requirePermission } from "@/lib/auth/session";
import { TelegramLinkRow } from "@/components/settings/TelegramLinkRow";

export default async function TelegramSettingsPage() {
  const { supabase } = await requirePermission("notifications.manage");
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, parent_telegram_chat_id")
    .eq("status", "active")
    .order("full_name");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink">Telegram bot</h1>

      <div className="rounded-xl border border-line p-4 text-sm text-ink-muted">
        <p>
          Har bir o&apos;quvchi uchun alohida havola bor. Havolani ota-onaga
          yuboring — u bosgach bot ulanadi va farzandi haqidagi xabarlarni
          (darsga kelmagani, qarzdorlik, to&apos;lov) shu bot orqali oladi.
        </p>
        {botUsername ? (
          <p className="mt-2">
            Bot: <span className="text-ink">@{botUsername}</span>
          </p>
        ) : (
          <p className="mt-2 text-red-400">
            Bot sozlanmagan: NEXT_PUBLIC_TELEGRAM_BOT_USERNAME kiritilmagan.
          </p>
        )}
      </div>

      {!students || students.length === 0 ? (
        <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
          Avval o&apos;quvchi qo&apos;shing.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">O&apos;quvchi</th>
                <th className="px-4 py-3 font-medium">Holati</th>
                <th className="px-4 py-3 font-medium">Ulash havolasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {students.map((student) => (
                <TelegramLinkRow
                  key={student.id}
                  studentName={student.full_name}
                  link={`https://t.me/${botUsername}?start=${student.id}`}
                  connected={Boolean(student.parent_telegram_chat_id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
