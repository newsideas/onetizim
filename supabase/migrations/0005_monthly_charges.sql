-- 0005_monthly_charges.sql
-- Oylik hisob (qarzdorlik) mexanizmi.
--
-- students.balance faqat to'lov kiritilganda oshardi, hech narsa uni
-- kamaytirmasdi — ya'ni "qarzdor" holati hech qachon yuzaga kelmasdi.
-- Bu migratsiya har oy uchun hisoblangan summani charges jadvalida
-- saqlaydi va balansdan avtomatik ayiradi.

-- Har bir o'quvchi uchun oylik hisob yozuvi.
-- unique (student_id, period) — bitta oy ikki marta hisoblanmaydi.
create table charges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  group_id uuid references groups(id),
  period date not null,        -- oyning 1-sanasi, masalan 2026-09-01
  amount numeric not null,     -- hisoblangan summa (musbat)
  created_at timestamptz default now(),
  unique (student_id, period)
);

alter table charges enable row level security;

create policy "charges_all_own_org" on charges
  for all using (
    exists (select 1 from students s where s.id = student_id and is_org_owner(s.org_id))
  ) with check (
    exists (select 1 from students s where s.id = student_id and is_org_owner(s.org_id))
  );

-- Hisob yozilganda balansdan ayirish (to'lov triggerining teskarisi).
create or replace function public.apply_charge_to_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update students
  set balance = balance - new.amount
  where id = new.student_id;
  return new;
end;
$$;

create trigger trg_apply_charge_to_balance
after insert on charges
for each row
execute function apply_charge_to_balance();

-- Bir oyning hisobini joriy tashkilotning barcha aktiv o'quvchilariga yozadi.
-- Nechta yangi yozuv qo'shilgani qaytariladi.
--
-- Xavfsizlik: tashkilot id'si parametr sifatida olinmaydi — auth.uid()
-- orqali o'zi topiladi, shunda boshqa tashkilotga hisob yozib bo'lmaydi.
create or replace function public.charge_monthly_fees(p_period date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_inserted integer;
begin
  select id into v_org_id
  from organizations
  where owner_id = auth.uid();

  if v_org_id is null then
    raise exception 'Tashkilot topilmadi';
  end if;

  insert into charges (student_id, group_id, period, amount)
  select s.id, s.group_id, date_trunc('month', p_period)::date, g.monthly_price
  from students s
  join groups g on g.id = s.group_id
  where s.org_id = v_org_id
    and s.status = 'active'
    and g.monthly_price > 0
  on conflict (student_id, period) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;
