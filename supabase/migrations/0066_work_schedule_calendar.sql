-- 0066_work_schedule_calendar.sql
-- Edu tizimdagi "Ish jadvali": yil, kod va har kun uchun ish vaqti yoki dam olish (yillik kalendar).
-- days: { "2026-09-05": "off", "2026-09-07": { "s": "09:00", "e": "18:00", "a": "08:50", "bs": "13:00", "be": "14:00" } }
-- Eski oddiy jadvallar (boshlanish/tugash vaqti) o'zgarishsiz qoladi.

alter table work_schedules
  alter column start_time drop not null,
  alter column end_time drop not null,
  add column if not exists year integer,
  add column if not exists code text,
  add column if not exists days jsonb not null default '{}'::jsonb;
