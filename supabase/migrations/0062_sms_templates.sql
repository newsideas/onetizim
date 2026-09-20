-- 0062_sms_templates.sql
-- Edu tizimdagi "SMS shablonlari": turi, sarlavha va SMS matni. Yuborish provayderi ulanmagan bo'lsa ham shablonlar saqlanadi.

create table if not exists sms_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  kind text not null,
  title text,
  body text,
  created_at timestamptz not null default now()
);

create index if not exists sms_templates_org_idx on sms_templates (org_id);
alter table sms_templates enable row level security;

drop policy if exists sms_templates_read on sms_templates;
create policy sms_templates_read on sms_templates for select using (is_org_member(org_id));

drop policy if exists sms_templates_manage on sms_templates;
create policy sms_templates_manage on sms_templates for all
  using (can_manage_org(org_id)) with check (can_manage_org(org_id));
