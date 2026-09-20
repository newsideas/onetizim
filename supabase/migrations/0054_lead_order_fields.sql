-- 0054_lead_order_fields.sql
-- Edu tizimdagi "Yangi buyurtma" oynasi maydonlari: referal bergan o'quvchi, dars kuni va vaqti,
-- o'qituvchi, yig'ilayotgan guruh va birinchi darsga kelish vaqti. Hammasi ixtiyoriy.

alter table leads
  add column if not exists referral_student_id uuid references students(id) on delete set null,
  add column if not exists lesson_days text
    check (lesson_days is null or lesson_days in ('Juft kunlar', 'Toq kunlar', 'Boshqa kunlar')),
  add column if not exists lesson_time time,
  add column if not exists teacher_id uuid references teachers(id) on delete set null,
  add column if not exists group_id uuid references groups(id) on delete set null,
  add column if not exists trial_time time;
