-- 0052_student_quick_fields.sql
-- Edu tizimdagi "Yangi o'quvchi qo'shish" oynasi maydonlari: elektron pochta, kategoriya,
-- pul to'lash sanasi, marketing so'rovnomasi, o'qish tili, ota va onaning ma'lumotlari.
-- Hammasi ixtiyoriy (nullable), eski o'quvchilarga ta'sir qilmaydi.

alter table students
  add column if not exists email text,
  add column if not exists category_id uuid references course_categories(id) on delete set null,
  add column if not exists payment_date date,
  add column if not exists marketing_campaign_id uuid references marketing_campaigns(id) on delete set null,
  add column if not exists study_language text,
  add column if not exists father_phone text,
  add column if not exists mother_name text,
  add column if not exists mother_phone text;
