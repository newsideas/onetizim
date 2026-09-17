-- 0025_finance_reports.sql
-- Moliyaviy hisobot funksiyalari. security invoker: har bir jadvalning
-- RLS'i amal qiladi, ya'ni natija avtomatik joriy tashkilot bilan
-- cheklanadi (menejer oyliklarni ko'rmaydi).

-- Kassa qoldig'i to'lov usullari bo'yicha (butun davr).
create or replace function public.cash_balance_by_method()
returns table (method text, income numeric, outcome numeric)
language sql
stable
security invoker
set search_path = public
as $fn$
  with income as (
    select p.method, sum(p.amount) as total from payments p group by p.method
  ),
  outcome as (
    select x.method, sum(x.amount) as total
    from (
      select e.method, e.amount from expenses e
      union all
      select s.method, s.amount from salary_payouts s
    ) x
    group by x.method
  )
  select m.method, coalesce(i.total, 0), coalesce(o.total, 0)
  from (values ('naqd'), ('karta'), ('click'), ('payme')) as m(method)
  left join income i on i.method = m.method
  left join outcome o on o.method = m.method;
$fn$;

-- Oylar kesimida tushum, xarajat va oyliklar.
create or replace function public.finance_monthly(p_from date, p_to date)
returns table (period date, income numeric, expenses numeric, salaries numeric)
language sql
stable
security invoker
set search_path = public
as $fn$
  with bounds as (
    select date_trunc('month', p_from)::date as m_from,
           (date_trunc('month', p_to) + interval '1 month')::date as m_to
  ),
  months as (
    select generate_series(b.m_from, b.m_to - interval '1 day', interval '1 month')::date as period
    from bounds b
  ),
  inc as (
    select date_trunc('month', p.paid_at)::date as period, sum(p.amount) as total
    from payments p, bounds b
    where p.paid_at >= b.m_from and p.paid_at < b.m_to
    group by 1
  ),
  exp as (
    select date_trunc('month', e.spent_at)::date as period, sum(e.amount) as total
    from expenses e, bounds b
    where e.spent_at >= b.m_from and e.spent_at < b.m_to
    group by 1
  ),
  sal as (
    select s.period, sum(s.amount) as total
    from salary_payouts s, bounds b
    where s.period >= b.m_from and s.period < b.m_to
    group by 1
  )
  select m.period, coalesce(inc.total, 0), coalesce(exp.total, 0), coalesce(sal.total, 0)
  from months m
  left join inc on inc.period = m.period
  left join exp on exp.period = m.period
  left join sal on sal.period = m.period
  order by m.period;
$fn$;

grant execute on function public.cash_balance_by_method() to authenticated;
grant execute on function public.finance_monthly(date, date) to authenticated;
