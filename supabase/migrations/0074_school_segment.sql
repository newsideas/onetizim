-- 0074_school_segment.sql
-- Xususiy maktab turi qaytariladi: super admin markaz ochishda "O'quv markaz" yoki "Xususiy maktab"ni tanlaydi.
-- Maktabda guruh = sinf (5-A): teacher_id — sinf rahbari, grade_level — sinf darajasi (1–11).
-- Mavjud markazlarga ta'sir qilmaydi.

alter table organizations drop constraint if exists organizations_type_check;
alter table organizations
  add constraint organizations_type_check check (type in ('markaz', 'maktab'));

alter table groups
  add column if not exists grade_level smallint check (grade_level is null or grade_level between 0 and 11);

create index if not exists groups_org_grade_idx on groups (org_id, grade_level);
