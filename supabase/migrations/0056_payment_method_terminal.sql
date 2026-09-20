-- 0056_payment_method_terminal.sql
-- Edu tizimda to'lov turlari: Naqd, Plastik, Terminal. "Plastik" bizda mavjud 'karta' qiymati,
-- "Terminal" esa yangi qiymat. Eski qiymatlar (click, payme) o'zgarmaydi.

do $$
declare
  t text;
  c record;
begin
  foreach t in array array['payments', 'expenses', 'salary_payouts']
  loop
    -- Jadvaldagi "method" ustuniga tegishli eski cheklovni topib olib tashlaymiz.
    for c in
      select con.conname
      from pg_constraint con
      where con.conrelid = format('public.%I', t)::regclass
        and con.contype = 'c'
        and pg_get_constraintdef(con.oid) ilike '%method%'
    loop
      execute format('alter table %I drop constraint %I', t, c.conname);
    end loop;

    execute format(
      'alter table %I add constraint %I check (method in (''naqd'', ''karta'', ''click'', ''payme'', ''terminal''))',
      t, t || '_method_check'
    );
  end loop;
end $$;

-- Kassa qoldig'i endi "terminal" usulini ham ko'rsatadi.
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
  from (values ('naqd'), ('karta'), ('terminal'), ('click'), ('payme')) as m(method)
  left join income i on i.method = m.method
  left join outcome o on o.method = m.method;
$fn$;
