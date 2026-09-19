-- 0036_teaches_group_active.sql
-- teaches_group ham obunasi tugagan maktab uchun "false" qaytaradi
-- (0035 dan keyin ishga tushiring).

create or replace function public.teaches_group(p_group uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1
    from public.groups g
    join public.org_members m on m.org_id = g.org_id and m.user_id = auth.uid()
    where g.id = p_group
      and public.org_is_active(g.org_id)
      and m.role = 'teacher'
      and m.employee_id is not null
      and (
        g.teacher_id = m.employee_id
        or exists (
          select 1 from public.lessons l
          where l.group_id = g.id and l.teacher_id = m.employee_id
        )
      )
  );
$fn$;
