-- 0002_policies.sql
-- RLS policy'lar: har bir foydalanuvchi faqat o'ziga tegishli (owner_id)
-- tashkilotning ma'lumotlarini ko'radi/o'zgartiradi.

-- Yordamchi funksiya: berilgan org_id joriy foydalanuvchiga tegishlimi?
create or replace function public.is_org_owner(check_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from organizations
    where id = check_org_id and owner_id = auth.uid()
  );
$$;

-- organizations: foydalanuvchi faqat o'zi egalik qiladigan tashkilotni
-- ko'radi; ro'yxatdan o'tganda o'z nomidan yozuv yarata oladi.
create policy "organizations_select_own" on organizations
  for select using (owner_id = auth.uid());

create policy "organizations_insert_own" on organizations
  for insert with check (owner_id = auth.uid());

create policy "organizations_update_own" on organizations
  for update using (owner_id = auth.uid());

-- teachers
create policy "teachers_all_own_org" on teachers
  for all using (is_org_owner(org_id)) with check (is_org_owner(org_id));

-- groups
create policy "groups_all_own_org" on groups
  for all using (is_org_owner(org_id)) with check (is_org_owner(org_id));

-- students
create policy "students_all_own_org" on students
  for all using (is_org_owner(org_id)) with check (is_org_owner(org_id));

-- attendance (org_id yo'q, group_id orqali tekshiriladi)
create policy "attendance_all_own_org" on attendance
  for all using (
    exists (select 1 from groups g where g.id = group_id and is_org_owner(g.org_id))
  ) with check (
    exists (select 1 from groups g where g.id = group_id and is_org_owner(g.org_id))
  );

-- payments (student_id orqali tekshiriladi)
create policy "payments_all_own_org" on payments
  for all using (
    exists (select 1 from students s where s.id = student_id and is_org_owner(s.org_id))
  ) with check (
    exists (select 1 from students s where s.id = student_id and is_org_owner(s.org_id))
  );

-- telegram_links (student_id orqali tekshiriladi)
create policy "telegram_links_all_own_org" on telegram_links
  for all using (
    exists (select 1 from students s where s.id = student_id and is_org_owner(s.org_id))
  ) with check (
    exists (select 1 from students s where s.id = student_id and is_org_owner(s.org_id))
  );
