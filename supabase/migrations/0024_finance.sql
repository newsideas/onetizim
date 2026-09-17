-- 0024_finance.sql
-- Kassa chiqimlari va xodimlarga oylik to'lovlari.
-- Kirim — mavjud payments jadvali. To'lov usullari payments bilan bir xil.

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  amount numeric not null check (amount > 0),
  category text not null,
  method text not null default 'naqd' check (method in ('naqd', 'karta', 'click', 'payme')),
  spent_at date not null default current_date,
  note text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists expenses_org_date_idx on expenses (org_id, spent_at desc);

alter table expenses enable row level security;
drop policy if exists expenses_manage on expenses;
create policy expenses_manage on expenses
  for all using (can_manage_org(org_id)) with check (can_manage_org(org_id));

-- Oylik to'lovlari: faqat direktor ko'radi va kiritadi.
create table if not exists salary_payouts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  employee_id uuid not null references teachers(id) on delete restrict,
  period date not null check (extract(day from period) = 1),
  amount numeric not null check (amount > 0),
  method text not null default 'naqd' check (method in ('naqd', 'karta', 'click', 'payme')),
  paid_at date not null default current_date,
  note text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists salary_payouts_org_period_idx on salary_payouts (org_id, period);
create index if not exists salary_payouts_employee_idx on salary_payouts (employee_id, period);

alter table salary_payouts enable row level security;
drop policy if exists salary_payouts_director on salary_payouts;
create policy salary_payouts_director on salary_payouts
  for all using (is_org_director(org_id))
  with check (
    is_org_director(org_id)
    and exists (select 1 from teachers t where t.id = employee_id and t.org_id = salary_payouts.org_id)
  );
