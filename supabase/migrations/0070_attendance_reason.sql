-- 0070_attendance_reason.sql
-- Edu tizimdagi davomat oynasi: kelmagan o'quvchi uchun "Sababi" (kasal, oilaviy sabab va h.k.).
-- Ustun ixtiyoriy; eski davomat yozuvlariga ta'sir qilmaydi.

alter table attendance add column if not exists reason text;
