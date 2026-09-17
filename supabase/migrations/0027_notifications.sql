-- 0027_notifications.sql
-- Yuborilgan bildirishnomalar tarixi. Avval davomat/qarzdorlik/to'lov
-- xabarlari yuborilardi-yu, hech qayerga yozilmasdi — "Eslatmalar"
-- bo'limi ko'rsatadigan ma'lumot yo'q edi.

create table if not exists notification_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  student_id uuid references students(id) on delete set null,
  channel text not null default 'telegram' check (channel in ('telegram', 'sms')),
  kind text not null check (kind in ('absent', 'debt', 'payment', 'broadcast')),
  message text not null,
  success boolean not null default true,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists notification_log_org_created_idx
  on notification_log (org_id, created_at desc);

alter table notification_log enable row level security;
drop policy if exists notification_log_manage on notification_log;
create policy notification_log_manage on notification_log
  for all using (can_manage_org(org_id)) with check (can_manage_org(org_id));
