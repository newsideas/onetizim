-- 0068_finance_year_flows.sql
-- Edu tizimdagi "Moliya hisobotlari (P&L)" va "Pul oqimi": oylar bo'yicha kirim-chiqim va yil boshidagi balans.
-- Funksiya security invoker: RLS ishlaydi, har markaz faqat o'z ma'lumotini ko'radi.
-- Tranzaksiya turiga "faoliyat turi" qo'shiladi (Operatsion / Investitsion / Moliyaviy) — pul oqimi hisobotida guruhlash uchun.

-- Bo'sh (null) qiymat hisobotda "Operatsion" hisoblanadi.
alter table transaction_types
  add column if not exists activity text
    check (activity is null or activity in ('Operatsion', 'Investitsion', 'Moliyaviy'));

-- Qaytadi: (kind, category, month, total). kind: income | expense | salary | opening (month = 0).
create or replace function public.finance_year_flows(p_year integer)
returns table (kind text, category text, month integer, total numeric)
language sql
stable
security invoker
set search_path = public
as $fn$
  select 'income'::text, coalesce(p.method, 'boshqa')::text, extract(month from p.paid_at)::integer, sum(p.amount)
    from payments p
   where extract(year from p.paid_at) = p_year
   group by 2, 3
  union all
  select 'expense'::text, coalesce(e.category, 'Boshqa')::text, extract(month from e.spent_at)::integer, sum(e.amount)
    from expenses e
   where extract(year from e.spent_at) = p_year
   group by 2, 3
  union all
  select 'salary'::text, 'Oylik'::text, extract(month from s.paid_at)::integer, sum(s.amount)
    from salary_payouts s
   where extract(year from s.paid_at) = p_year
   group by 3
  union all
  select 'opening'::text, ''::text, 0,
         coalesce((select sum(amount) from payments where paid_at < make_date(p_year, 1, 1)), 0)
         - coalesce((select sum(amount) from expenses where spent_at < make_date(p_year, 1, 1)), 0)
         - coalesce((select sum(amount) from salary_payouts where paid_at < make_date(p_year, 1, 1)), 0);
$fn$;

grant execute on function public.finance_year_flows(integer) to authenticated;
