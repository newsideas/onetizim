-- 0018_rls_core.sql
-- Tashkilot, a'zolar, xodimlar, guruhlar va o'quvchilar uchun rolga
-- asoslangan RLS. O'qituvchi faqat o'z guruhlari va ulardagi
-- o'quvchilarni o'qiy oladi.

-- organizations: a'zolar ko'radi, faqat direktor o'zgartiradi.
drop policy if exists "organizations_select_own" on organizations;
drop policy if exists "organizations_update_own" on organizations;
create policy organizations_select_member on organizations
  for select using (owner_id = auth.uid() or is_org_member(id));
create policy organizations_update_director on organizations
  for update using (is_org_director(id)) with check (is_org_director(id));

-- org_members: a'zolar ro'yxatini ko'radi, faqat direktor boshqaradi.
-- Egasining o'z yozuvini o'chirib yoki pasaytirib bo'lmaydi.
alter table org_members enable row level security;
drop policy if exists org_members_select on org_members;
drop policy if exists org_members_update on org_members;
drop policy if exists org_members_delete on org_members;
create policy org_members_select on org_members
  for select using (is_org_member(org_id));
create policy org_members_update on org_members
  for update using (is_org_director(org_id) and role <> 'owner')
  with check (is_org_director(org_id) and role <> 'owner');
create policy org_members_delete on org_members
  for delete using (is_org_director(org_id) and role <> 'owner');

-- teachers (xodimlar): boshqaruv o'qiydi, o'qituvchi faqat o'zini,
-- yozish faqat direktor (maosh stavkalari shu yerda).
drop policy if exists "teachers_all_own_org" on teachers;
drop policy if exists teachers_select on teachers;
drop policy if exists teachers_write on teachers;
create policy teachers_select on teachers
  for select using (
    can_manage_org(org_id)
    or exists (
      select 1 from org_members m
      where m.org_id = teachers.org_id and m.user_id = auth.uid() and m.employee_id = teachers.id
    )
  );
create policy teachers_write on teachers
  for all using (is_org_director(org_id)) with check (is_org_director(org_id));
-- Menejer guruh formasida yangi o'qituvchi nomini yozsa yaratiladi.
create policy teachers_insert_manager on teachers
  for insert with check (can_manage_org(org_id));

-- groups
drop policy if exists "groups_all_own_org" on groups;
drop policy if exists groups_manage on groups;
drop policy if exists groups_teacher_select on groups;
create policy groups_manage on groups
  for all using (can_manage_org(org_id)) with check (can_manage_org(org_id));
create policy groups_teacher_select on groups
  for select using (teaches_group(id));

-- students
drop policy if exists "students_all_own_org" on students;
drop policy if exists students_manage on students;
drop policy if exists students_teacher_select on students;
create policy students_manage on students
  for all using (can_manage_org(org_id)) with check (can_manage_org(org_id));
create policy students_teacher_select on students
  for select using (group_id is not null and teaches_group(group_id));
