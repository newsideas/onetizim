-- 0040_login_accounts.sql
-- Login/parol bilan kirish: a'zoning login'i (telefon yoki direktor bergan login)
-- saqlanadi. Buxgalter roli uchun moliya bo'yicha qo'shimcha RLS.
-- (0039 dan keyin ishga tushiring.)

alter table org_members add column if not exists login text;

create unique index if not exists org_members_login_key
  on org_members (org_id, lower(login)) where login is not null;

create or replace function public.is_org_accountant(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select public.org_is_active(p_org) and exists (
    select 1 from public.org_members
    where org_id = p_org and user_id = auth.uid() and role = 'accountant'
  );
$fn$;

-- Buxgalter: o'quvchi va sinflarni faqat o'qiydi.
drop policy if exists students_accountant_select on students;
create policy students_accountant_select on students
  for select using (is_org_accountant(org_id));

drop policy if exists groups_accountant_select on groups;
create policy groups_accountant_select on groups
  for select using (is_org_accountant(org_id));

-- Buxgalter: to'lov, hisob va xarajatlar bilan to'liq ishlaydi.
do $$
declare
  t text;
begin
  foreach t in array array['payments', 'charges'] loop
    execute format('drop policy if exists %I on %I', t || '_accountant', t);
    execute format(
      'create policy %I on %I for all using (exists (select 1 from students s where s.id = student_id and is_org_accountant(s.org_id))) with check (exists (select 1 from students s where s.id = student_id and is_org_accountant(s.org_id)))',
      t || '_accountant', t
    );
  end loop;

  foreach t in array array['expenses', 'contracts'] loop
    execute format('drop policy if exists %I on %I', t || '_accountant', t);
    execute format(
      'create policy %I on %I for all using (is_org_accountant(org_id)) with check (is_org_accountant(org_id))',
      t || '_accountant', t
    );
  end loop;

  foreach t in array array[
    'contract_types', 'contract_discounts', 'bank_accounts', 'contract_amounts'
  ] loop
    execute format('drop policy if exists %I on %I', t || '_accountant', t);
    execute format(
      'create policy %I on %I for select using (is_org_accountant(org_id))',
      t || '_accountant', t
    );
  end loop;
end $$;
