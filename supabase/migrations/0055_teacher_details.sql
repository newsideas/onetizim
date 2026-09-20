-- 0055_teacher_details.sql
-- Edu tizimdagi "Xodim qo'shish" oynasi maydonlari: jinsi, tug'ilgan sanasi, ish haqi chiqarish belgisi,
-- ish jadvali, izoh va elektron pochta. Hammasi ixtiyoriy (eski xodimlarga ta'sir qilmaydi).

alter table teachers
  add column if not exists gender text check (gender is null or gender in ('Erkak', 'Ayol')),
  add column if not exists birth_date date,
  add column if not exists pays_salary boolean not null default true,
  add column if not exists work_schedule_id uuid references work_schedules(id) on delete set null,
  add column if not exists comment text,
  add column if not exists email text;
