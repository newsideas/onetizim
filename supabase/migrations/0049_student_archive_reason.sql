-- 0049_student_archive_reason.sql
-- "Ketish sabablari" hisoboti uchun: o'quvchi arxivlanganda sabab saqlanadi.
-- Sabab ixtiyoriy; eski arxivlanganlarda bo'sh qoladi.

alter table students add column if not exists archive_reason text;
