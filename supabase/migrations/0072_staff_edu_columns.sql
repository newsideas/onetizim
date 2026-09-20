-- 0072_staff_edu_columns.sql
-- Edu tizimdagi "Xodimlar" ro'yxati: filiallar, ketish sanasi va sababi.
-- Hammasi ixtiyoriy; eski yozuvlarga ta'sir qilmaydi.

alter table teachers
  add column if not exists branch_ids uuid[] not null default '{}',
  add column if not exists left_on date,
  add column if not exists leave_reason text;
