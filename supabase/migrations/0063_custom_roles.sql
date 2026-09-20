-- 0063_custom_roles.sql
-- Edu tizimdagi "Rollar": markaz o'zi nom, izoh va ruxsatlar bilan rol yaratadi.
-- Bazadagi haqiqiy himoya (RLS) asosiy rolga (base_role) tayanadi; maxsus rol ruxsatlarni faqat
-- shu asosiy rol doirasida kamaytiradi, kengaytira olmaydi.

create table if not exists org_roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  comment text,
  base_role org_role not null default 'manager' check (base_role <> 'owner'),
  permissions text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists org_roles_org_idx on org_roles (org_id);
alter table org_roles enable row level security;

drop policy if exists org_roles_read on org_roles;
create policy org_roles_read on org_roles for select using (is_org_member(org_id));

drop policy if exists org_roles_manage on org_roles;
create policy org_roles_manage on org_roles for all
  using (can_manage_org(org_id)) with check (can_manage_org(org_id));

alter table org_members
  add column if not exists custom_role_id uuid references org_roles(id) on delete set null;
