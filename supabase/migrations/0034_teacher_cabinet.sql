-- 0034_teacher_cabinet.sql
-- O'qituvchi kabineti uchun:
-- 1) teaches_group: sinf rahbari YOKI shu sinfda dars beradigan fan o'qituvchisi
--    (davomat, baho, o'quvchilar shu funksiya orqali ochiladi).
-- 2) uy vazifalari (homework).

create or replace function public.teaches_group(p_group uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1
    from groups g
    join org_members m on m.org_id = g.org_id and m.user_id = auth.uid()
    where g.id = p_group
      and m.role = 'teacher'
      and m.employee_id is not null
      and (
        g.teacher_id = m.employee_id
        or exists (
          select 1 from lessons l
          where l.group_id = g.id and l.teacher_id = m.employee_id
        )
      )
  );
$fn$;

create table if not exists homework (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  subject text not null,
  title text not null,
  details text,
  due_on date not null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists homework_group_due_idx on homework (org_id, group_id, due_on desc);

alter table homework enable row level security;

drop policy if exists homework_manage on homework;
create policy homework_manage on homework
  for all using (can_manage_org(org_id))
  with check (
    can_manage_org(org_id)
    and exists (select 1 from groups g where g.id = group_id and g.org_id = homework.org_id)
  );

drop policy if exists homework_teacher on homework;
create policy homework_teacher on homework
  for all using (teaches_group(group_id))
  with check (
    teaches_group(group_id)
    and exists (select 1 from groups g where g.id = group_id and g.org_id = homework.org_id)
  );
