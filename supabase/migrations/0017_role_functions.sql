-- 0017_role_functions.sql
-- RLS siyosatlarida ishlatiladigan rol funksiyalari. Hammasi security
-- definer: org_members'ning o'z RLS'iga qayta murojaat qilib sikl hosil
-- qilmaydi.

create or replace function public.is_org_member(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from org_members where org_id = p_org and user_id = auth.uid());
$fn$;

-- Direktor yoki menejer: kundalik operatsiyalar.
create or replace function public.can_manage_org(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from org_members
    where org_id = p_org and user_id = auth.uid() and role in ('owner', 'manager')
  );
$fn$;

-- Faqat direktor: xodimlar, maosh, sozlamalar.
create or replace function public.is_org_director(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from org_members
    where org_id = p_org and user_id = auth.uid() and role = 'owner'
  );
$fn$;

create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path = public as $fn$
  select org_id from org_members where user_id = auth.uid() limit 1;
$fn$;

-- O'qituvchi shu guruhga biriktirilganmi (xodim kartasi orqali).
create or replace function public.teaches_group(p_group uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1
    from groups g
    join org_members m on m.org_id = g.org_id and m.user_id = auth.uid()
    where g.id = p_group
      and m.role = 'teacher'
      and m.employee_id is not null
      and g.teacher_id = m.employee_id
  );
$fn$;

-- Oylik hisob endi menejer ham yopa oladi; tashkilot a'zolik orqali topiladi.
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
$fn$;
