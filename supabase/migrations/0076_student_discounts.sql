-- 0076_student_discounts.sql
-- O'quvchi chegirmasi (aka-uka, a'lochi, xodim farzandi...): oylik hisob yozilganda
-- sinf/guruh narxidan shu foiz ayriladi. Hisob yozuvida asl narx va chegirma summasi saqlanadi
-- (chegirmalar hisoboti uchun).

alter table students
  add column if not exists discount_percent smallint not null default 0
    check (discount_percent between 0 and 100),
  add column if not exists discount_reason text
    check (discount_reason is null or char_length(discount_reason) <= 60);

alter table charges
  add column if not exists base_amount numeric,
  add column if not exists discount numeric not null default 0 check (discount >= 0);

create or replace function public.charge_monthly_fees(p_period date)
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_org_id uuid := current_org_id();
  v_inserted integer;
begin
  if v_org_id is null or not can_manage_org(v_org_id) then
    raise exception 'Ruxsat yo''q';
  end if;

  insert into charges (student_id, group_id, period, amount, base_amount, discount)
  select
    s.id,
    s.group_id,
    date_trunc('month', p_period)::date,
    x.amount,
    g.monthly_price,
    g.monthly_price - x.amount
  from students s
  join groups g on g.id = s.group_id
  cross join lateral (
    select round(g.monthly_price * (100 - coalesce(s.discount_percent, 0)) / 100.0) as amount
  ) x
  where s.org_id = v_org_id
    and s.status = 'active'
    and g.monthly_price > 0
    and x.amount > 0
  on conflict (student_id, period) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$fn$;
