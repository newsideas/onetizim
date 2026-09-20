-- 0058_bonus_fine_type.sql
-- Edu tizimdagi Bonus va Jarima oynalarida "Tranzaksiya turi" tanlanadi.
-- Xodim bonusi/jarimasi jadvallariga tur ustuni qo'shiladi (ixtiyoriy).

alter table staff_bonuses
  add column if not exists transaction_type_id uuid references transaction_types(id) on delete set null;

alter table staff_fines
  add column if not exists transaction_type_id uuid references transaction_types(id) on delete set null;
