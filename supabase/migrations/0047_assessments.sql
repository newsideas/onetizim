-- 0047_assessments.sql
-- Mavsumiy baholash (Edu tizimdagi "O'quv bo'limi → Mavsumiy baholash"):
-- o'quvchining guruhdagi oylik/mavsumiy bahosi va izohi.
-- Ko'rish: barcha a'zolar; o'zgartirish: direktor va administrator.

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  group_id uuid references groups(id) on delete set null,
  assessed_on date not null default current_date,
  score numeric not null check (score >= 0),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists assessments_org_date_idx on assessments (org_id, assessed_on desc);

alter table assessments enable row level security;

drop policy if exists assessments_read on assessments;
create policy assessments_read on assessments
  for select using (is_org_member(org_id));

drop policy if exists assessments_manage on assessments;
create policy assessments_manage on assessments
  for all using (can_manage_org(org_id))
  with check (
    can_manage_org(org_id)
    and exists (select 1 from students s where s.id = student_id and s.org_id = assessments.org_id)
  );
