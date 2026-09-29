-- Supabase Dashboard -> SQL Editor -> New query: shu faylni to'liq joylab Run bosing.
-- Qayta ishga tushirilsa ham zarar qilmaydi (if not exists).
--
-- 0072: xodim filiallari, ketish sanasi va sababi
-- 0073: vazifa turi (uy vazifasi / imtihon / test)
-- 0074: xususiy maktab turi va sinf darajasi

alter table teachers
  add column if not exists branch_ids uuid[] not null default '{}',
  add column if not exists left_on date,
  add column if not exists leave_reason text;

alter table homework
  add column if not exists kind text not null default 'Uy vazifasi';

alter table organizations drop constraint if exists organizations_type_check;
alter table organizations
  add constraint organizations_type_check check (type in ('markaz', 'maktab'));

alter table groups
  add column if not exists grade_level smallint check (grade_level is null or grade_level between 0 and 11);

create index if not exists groups_org_grade_idx on groups (org_id, grade_level);
