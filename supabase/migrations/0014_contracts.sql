-- 0014_contracts.sql
-- Shartnomalar (My School: Shartnomalar bo'limi).
--
-- Ma'lumotnomalar birinchi (turlari, chegirmalari, bank rekvizitlari),
-- keyin shartnomaning o'zi — bitta o'quvchiga bog'langan, summasi va
-- fayli bilan.

create table if not exists contract_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  code text,
  note text,
  created_at timestamptz default now(),
  unique (org_id, name)
);

create table if not exists contract_discounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  discount_type text check (discount_type in ('percent', 'fixed')) default 'percent',
  amount numeric not null default 0,
  note text,
  created_at timestamptz default now()
);

create table if not exists bank_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  bank_name text not null,
  account_number text,
  mfo text,
  tin text,
  created_at timestamptz default now()
);

create table if not exists contract_amounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  academic_year_id uuid references academic_years(id) on delete set null,
  class_type_id uuid references class_types(id) on delete set null,
  amount numeric not null default 0,
  created_at timestamptz default now()
);

-- Shartnomaning o'zi. Chegirma summasi yozish paytida muzlatiladi:
-- keyin chegirma ma'lumotnomasi o'zgarsa ham eski shartnoma o'zgarmaydi.
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  contract_number text,
  contract_type_id uuid references contract_types(id) on delete set null,
  academic_year_id uuid references academic_years(id) on delete set null,
  discount_id uuid references contract_discounts(id) on delete set null,
  base_amount numeric not null default 0 check (base_amount >= 0),
  discount_amount numeric not null default 0 check (discount_amount >= 0),
  amount numeric not null default 0 check (amount >= 0),
  file_path text,
  file_name text,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  created_at timestamptz default now()
);

create unique index if not exists contracts_org_number_key
  on contracts (org_id, contract_number) where contract_number is not null;
create index if not exists contracts_org_status_idx on contracts (org_id, status);

-- O'quvchi ham shu tashkilotniki bo'lishi shart.
alter table contracts enable row level security;
drop policy if exists contracts_all_own_org on contracts;
create policy contracts_all_own_org on contracts for all
  using (is_org_owner(org_id))
  with check (
    is_org_owner(org_id)
    and exists (select 1 from students s where s.id = student_id and s.org_id = contracts.org_id)
  );

do $$
declare
  t text;
begin
  foreach t in array array[
    'contract_types', 'contract_discounts', 'bank_accounts', 'contract_amounts'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_all_own_org', t);
    execute format(
      'create policy %I on %I for all using (is_org_owner(org_id)) with check (is_org_owner(org_id))',
      t || '_all_own_org', t
    );
  end loop;
end $$;
