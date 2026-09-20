-- 0060_transaction_type_details.sql
-- Edu tizimdagi "Tranzaksiya turini qo'shish" oynasi: rang, yuqori tranzaksiya, minimal/maksimal miqdor
-- va mijoz turi. Hammasi ixtiyoriy; eski tranzaksiya turlariga ta'sir qilmaydi.

alter table transaction_types
  add column if not exists color text,
  add column if not exists parent_id uuid references transaction_types(id) on delete set null,
  add column if not exists min_amount numeric check (min_amount is null or min_amount >= 0),
  add column if not exists max_amount numeric check (max_amount is null or max_amount >= 0),
  add column if not exists client_type text
    check (client_type is null or client_type in ('Boshqa', 'O''quvchilar', 'Xodim', 'Uchinchi shaxs'));
