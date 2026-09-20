-- 0073_homework_kind.sql
-- Edu tizimdagi "Barcha vazifalar" ro'yxatidagi "Turi" ustuni: uy vazifasi, imtihon, test.

alter table homework
  add column if not exists kind text not null default 'Uy vazifasi';
