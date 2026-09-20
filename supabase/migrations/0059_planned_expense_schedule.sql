-- 0059_planned_expense_schedule.sql
-- Edu tizimdagi "Rejalashtirilgan xarajatlar": takrorlanuvchi reja — turi (kunlik/oylik), holati,
-- boshlanish va tugash sanasi. Eski ustunlar (due_date, note) o'zgarishsiz qoladi.

alter table planned_expenses
  add column if not exists kind text check (kind is null or kind in ('Kunlik', 'Oylik')),
  add column if not exists status text check (status is null or status in ('Aktiv', 'Nofaol')),
  add column if not exists start_date date,
  add column if not exists end_date date;
