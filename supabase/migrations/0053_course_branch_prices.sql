-- 0053_course_branch_prices.sql
-- Edu tizimdagi kurs formasi: kurs qaysi filiallarda o'qitilishi va har bir filialdagi bitta dars narxi.
-- Ko'rish: barcha a'zolar; o'zgartirish: direktor va administrator.

-- Edu tizimdagidek har bir markazda kamida bitta filial bo'ladi: bo'sh markazlarga markaz nomi bilan qo'shamiz.
insert into branches (org_id, name)
select o.id, o.name
from organizations o
where not exists (select 1 from branches b where b.org_id = o.id);

create table if not exists course_branch_prices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  available boolean not null default true,
  price numeric not null default 0 check (price >= 0),
  created_at timestamptz not null default now(),
  unique (course_id, branch_id)
);

create index if not exists course_branch_prices_org_idx on course_branch_prices (org_id);

alter table course_branch_prices enable row level security;

drop policy if exists course_branch_prices_read on course_branch_prices;
create policy course_branch_prices_read on course_branch_prices
  for select using (is_org_member(org_id));

drop policy if exists course_branch_prices_manage on course_branch_prices;
create policy course_branch_prices_manage on course_branch_prices
  for all using (can_manage_org(org_id)) with check (can_manage_org(org_id));
