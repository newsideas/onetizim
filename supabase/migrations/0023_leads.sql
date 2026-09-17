-- 0023_leads.sql
-- Lidlar (savdo voronkasi): Murojaat -> Sinov darsi -> O'ylashmoqda ->
-- Shartnoma, yoki Rad etildi. Faqat boshqaruv (direktor, menejer).

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  phone text,
  source text,
  interest text,
  stage text not null default 'new'
    check (stage in ('new', 'trial', 'thinking', 'contract', 'lost')),
  assigned_to uuid references auth.users(id) on delete set null,
  trial_date date,
  note text,
  student_id uuid references students(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_org_stage_idx on leads (org_id, stage, updated_at desc);
create index if not exists leads_org_created_idx on leads (org_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $fn$
begin
  new.updated_at := now();
  return new;
end;
$fn$;

drop trigger if exists trg_leads_updated_at on leads;
create trigger trg_leads_updated_at
before update on leads
for each row execute function touch_updated_at();

alter table leads enable row level security;
drop policy if exists leads_manage on leads;
create policy leads_manage on leads
  for all using (can_manage_org(org_id))
  with check (
    can_manage_org(org_id)
    and (assigned_to is null or exists (
      select 1 from org_members m
      where m.org_id = leads.org_id and m.user_id = leads.assigned_to
    ))
    and (student_id is null or exists (
      select 1 from students s where s.id = leads.student_id and s.org_id = leads.org_id
    ))
  );
