-- 0026_salary_calculation.sql
-- Xodimlarning oylik hisobi. Stavka xodim kartasida (teachers):
--   fixed      — oyiga qat'iy summa
--   per_lesson — o'tilgan dars uchun: davomat belgilangan har bir
--                (guruh, sana) juftligi bitta dars hisoblanadi
--   percent    — xodim guruhlaridagi o'quvchilardan shu oyda tushgan
--                to'lovlarning foizi
-- security invoker: RLS amal qiladi.

create or replace function public.salary_calculation(p_period date)
returns table (
  employee_id uuid,
  full_name text,
  "position" text,
  kind text,
  salary_type text,
  rate numeric,
  lessons bigint,
  revenue numeric,
  accrued numeric,
  paid numeric
)
language sql
stable
security invoker
set search_path = public
as $fn$
  with bounds as (
    select date_trunc('month', p_period)::date as m_from,
           (date_trunc('month', p_period) + interval '1 month')::date as m_to
  ),
  lessons as (
    select g.teacher_id, count(distinct (a.group_id, a.lesson_date)) as cnt
    from attendance a
    join groups g on g.id = a.group_id
    cross join bounds b
    where a.lesson_date >= b.m_from and a.lesson_date < b.m_to
    group by g.teacher_id
  ),
  revenue as (
    select g.teacher_id, sum(p.amount) as total
    from payments p
    join students s on s.id = p.student_id
    join groups g on g.id = s.group_id
    cross join bounds b
    where p.paid_at >= b.m_from and p.paid_at < b.m_to
    group by g.teacher_id
  ),
  paid as (
    select sp.employee_id, sum(sp.amount) as total
    from salary_payouts sp
    cross join bounds b
    where sp.period = b.m_from
    group by sp.employee_id
  )
  select
    t.id,
    t.full_name,
    t.position,
    t.kind,
    t.salary_type,
    t.rate,
    coalesce(l.cnt, 0),
    coalesce(r.total, 0),
    round(case t.salary_type
      when 'fixed' then coalesce(t.rate, 0)
      when 'per_lesson' then coalesce(t.rate, 0) * coalesce(l.cnt, 0)
      when 'percent' then coalesce(t.rate, 0) / 100 * coalesce(r.total, 0)
      else 0
    end),
    coalesce(pd.total, 0)
  from teachers t
  left join lessons l on l.teacher_id = t.id
  left join revenue r on r.teacher_id = t.id
  left join paid pd on pd.employee_id = t.id
  where t.is_active or pd.total is not null
  order by t.full_name;
$fn$;

grant execute on function public.salary_calculation(date) to authenticated;
