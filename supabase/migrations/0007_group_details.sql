-- 0007_group_details.sql
-- Guruhga Edu tizimdagi kabi qo'shimcha maydonlar va o'quvchiga
-- "muzlatilgan" holati.

alter table groups
  add column start_date date,                    -- guruh boshlanish sanasi
  add column end_date date,                      -- tugash sanasi
  add column lesson_duration_minutes integer,    -- bitta dars davomiyligi
  add column education_type text
    check (education_type in ('offline','online'))
    default 'offline';

-- O'quvchi vaqtincha to'xtatilishi mumkin (ta'til, kasallik) — bu
-- arxivlashdan farq qiladi: muzlatilgan o'quvchi keyin qaytadi.
alter table students drop constraint if exists students_status_check;
alter table students add constraint students_status_check
  check (status in ('active','frozen','archived'));
