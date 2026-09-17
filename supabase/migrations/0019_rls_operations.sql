-- 0019_rls_operations.sql
-- Davomat: boshqaruv hammasini, o'qituvchi faqat o'z guruhini belgilaydi.
-- To'lov, hisob, Telegram bog'lanishi: faqat boshqaruv.

drop policy if exists "attendance_all_own_org" on attendance;
drop policy if exists attendance_manage on attendance;
drop policy if exists attendance_teacher on attendance;
create policy attendance_manage on attendance
  for all using (
    exists (select 1 from groups g where g.id = group_id and can_manage_org(g.org_id))
  ) with check (
    exists (select 1 from groups g where g.id = group_id and can_manage_org(g.org_id))
  );
create policy attendance_teacher on attendance
  for all using (teaches_group(group_id))
  with check (
    teaches_group(group_id)
    and exists (
      select 1 from students s
      where s.id = student_id and s.group_id = attendance.group_id
    )
  );

do $$
declare
  t text;
begin
  foreach t in array array['payments', 'charges', 'telegram_links'] loop
    execute format('drop policy if exists %I on %I', t || '_all_own_org', t);
    execute format('drop policy if exists %I on %I', t || '_manage', t);
    execute format(
      'create policy %I on %I for all using (exists (select 1 from students s where s.id = student_id and can_manage_org(s.org_id))) with check (exists (select 1 from students s where s.id = student_id and can_manage_org(s.org_id)))',
      t || '_manage', t
    );
  end loop;
end $$;
