-- 0057_cashboxes.sql
-- Edu tizimdagidek ko'p kassa: kassalar, kassalar orasida ko'chirish va har bir to'lov/xarajat/oylikning kassasi.
-- Kassa ko'rsatilmagan yozuvlar avtomatik tashkilotning birinchi kassasiga (asosiy kassa) tushadi.
-- Ko'rish: barcha a'zolar; o'zgartirish: direktor va administrator.

create table if not exists cashboxes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  moderator_id uuid references teachers(id) on delete set null,
  accepts_online boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists cashboxes_org_idx on cashboxes (org_id, created_at);

create table if not exists cash_transfers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  from_cashbox_id uuid not null references cashboxes(id) on delete restrict,
  to_cashbox_id uuid not null references cashboxes(id) on delete restrict,
  amount numeric not null check (amount > 0),
  method text not null default 'naqd'
    check (method in ('naqd', 'karta', 'click', 'payme', 'terminal')),
  transfer_date date not null default current_date,
  note text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  check (from_cashbox_id <> to_cashbox_id)
);

create index if not exists cash_transfers_org_idx on cash_transfers (org_id, transfer_date desc);

do $$
declare
  t text;
begin
  foreach t in array array['cashboxes', 'cash_transfers']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_read', t);
    execute format('create policy %I on %I for select using (is_org_member(org_id))', t || '_read', t);
    execute format('drop policy if exists %I on %I', t || '_manage', t);
    execute format(
      'create policy %I on %I for all using (can_manage_org(org_id)) with check (can_manage_org(org_id))',
      t || '_manage', t
    );
  end loop;
end $$;

-- To'lov, xarajat va oylik endi kassaga bog'lanadi.
alter table payments add column if not exists cashbox_id uuid references cashboxes(id) on delete set null;
alter table expenses add column if not exists cashbox_id uuid references cashboxes(id) on delete set null;
alter table salary_payouts add column if not exists cashbox_id uuid references cashboxes(id) on delete set null;

create index if not exists payments_cashbox_idx on payments (cashbox_id);
create index if not exists expenses_cashbox_idx on expenses (cashbox_id);
create index if not exists salary_payouts_cashbox_idx on salary_payouts (cashbox_id);

-- Har bir tashkilotda kamida bitta kassa bo'ladi.
insert into cashboxes (org_id, name)
select o.id, 'Asosiy kassa'
from organizations o
where not exists (select 1 from cashboxes c where c.org_id = o.id);

-- Kassa ko'rsatilmasa, tashkilotning birinchi faol kassasi tanlanadi (yo'q bo'lsa yaratiladi).
create or replace function public.default_cashbox(p_org uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_id uuid;
begin
  select id into v_id
  from cashboxes
  where org_id = p_org and not is_archived
  order by created_at
  limit 1;

  if v_id is null then
    insert into cashboxes (org_id, name) values (p_org, 'Asosiy kassa') returning id into v_id;
  end if;
  return v_id;
end;
$fn$;

create or replace function public.assign_default_cashbox()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_org uuid;
begin
  if new.cashbox_id is not null then
    return new;
  end if;

  if tg_table_name = 'payments' then
    select s.org_id into v_org from students s where s.id = new.student_id;
  else
    v_org := new.org_id;
  end if;

  if v_org is not null then
    new.cashbox_id := default_cashbox(v_org);
  end if;
  return new;
end;
$fn$;

drop trigger if exists trg_payments_default_cashbox on payments;
create trigger trg_payments_default_cashbox
before insert on payments
for each row execute function assign_default_cashbox();

drop trigger if exists trg_expenses_default_cashbox on expenses;
create trigger trg_expenses_default_cashbox
before insert on expenses
for each row execute function assign_default_cashbox();

drop trigger if exists trg_salary_payouts_default_cashbox on salary_payouts;
create trigger trg_salary_payouts_default_cashbox
before insert on salary_payouts
for each row execute function assign_default_cashbox();

-- Mavjud yozuvlarni asosiy kassaga bog'laymiz.
update payments p
set cashbox_id = default_cashbox(s.org_id)
from students s
where p.student_id = s.id and p.cashbox_id is null and s.org_id is not null;

update expenses set cashbox_id = default_cashbox(org_id) where cashbox_id is null;
update salary_payouts set cashbox_id = default_cashbox(org_id) where cashbox_id is null;

-- Kassalar qoldig'i: kirim = to'lovlar + kelgan ko'chirishlar, chiqim = xarajat + oylik + ketgan ko'chirishlar.
create or replace function public.cashbox_balances()
returns table (cashbox_id uuid, income numeric, outcome numeric)
language sql
stable
security invoker
set search_path = public
as $fn$
  select
    c.id,
    coalesce((select sum(p.amount) from payments p where p.cashbox_id = c.id), 0)
      + coalesce((select sum(t.amount) from cash_transfers t where t.to_cashbox_id = c.id), 0),
    coalesce((select sum(e.amount) from expenses e where e.cashbox_id = c.id), 0)
      + coalesce((select sum(s.amount) from salary_payouts s where s.cashbox_id = c.id), 0)
      + coalesce((select sum(t.amount) from cash_transfers t where t.from_cashbox_id = c.id), 0)
  from cashboxes c;
$fn$;
