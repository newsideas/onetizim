-- 0020_rls_references.sql
-- Ma'lumotnomalar: barcha a'zolar o'qiydi (jadval, xona nomlari),
-- o'zgartirish faqat direktor. Xona va kurs guruh formasida nom bilan
-- yaratilgani uchun menejer ham yoza oladi.
-- Shartnoma ma'lumotnomalari va shartnomalar: faqat boshqaruv.

do $$
declare
  t text;
begin
  foreach t in array array[
    'academic_years', 'class_types', 'shifts', 'academic_languages',
    'buildings', 'lesson_times', 'academic_periods', 'training_types'
  ] loop
    execute format('drop policy if exists %I on %I', t || '_all_own_org', t);
    execute format('drop policy if exists %I on %I', t || '_select', t);
    execute format('drop policy if exists %I on %I', t || '_write', t);
    execute format('create policy %I on %I for select using (is_org_member(org_id))', t || '_select', t);
    execute format(
      'create policy %I on %I for all using (is_org_director(org_id)) with check (is_org_director(org_id))',
      t || '_write', t
    );
  end loop;

  foreach t in array array['rooms', 'courses'] loop
    execute format('drop policy if exists %I on %I', t || '_all_own_org', t);
    execute format('drop policy if exists %I on %I', t || '_select', t);
    execute format('drop policy if exists %I on %I', t || '_write', t);
    execute format('create policy %I on %I for select using (is_org_member(org_id))', t || '_select', t);
    execute format(
      'create policy %I on %I for all using (can_manage_org(org_id)) with check (can_manage_org(org_id))',
      t || '_write', t
    );
  end loop;

  foreach t in array array[
    'contract_types', 'contract_discounts', 'bank_accounts', 'contract_amounts'
  ] loop
    execute format('drop policy if exists %I on %I', t || '_all_own_org', t);
    execute format('drop policy if exists %I on %I', t || '_select', t);
    execute format('drop policy if exists %I on %I', t || '_write', t);
    execute format('create policy %I on %I for select using (can_manage_org(org_id))', t || '_select', t);
    execute format(
      'create policy %I on %I for all using (is_org_director(org_id)) with check (is_org_director(org_id))',
      t || '_write', t
    );
  end loop;
end $$;

drop policy if exists contracts_all_own_org on contracts;
create policy contracts_all_own_org on contracts for all
  using (can_manage_org(org_id))
  with check (
    can_manage_org(org_id)
    and exists (select 1 from students s where s.id = student_id and s.org_id = contracts.org_id)
  );

create or replace function public.owns_storage_path(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  folder text := (storage.foldername(object_name))[1];
begin
  if folder is null
     or folder !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return can_manage_org(folder::uuid);
end;
$fn$;
