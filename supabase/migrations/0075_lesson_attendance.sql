-- 0075_lesson_attendance.sql
-- Xususiy maktab: fan (dars) bo'yicha davomat. Har bir dars soati uchun alohida belgi
-- (Keldi / Kechikdi / Kelmadi + sabab). Kunlik "attendance" jadvali o'zgarmaydi
-- (o'quv markazlari uchun guruh davomati sifatida qoladi).

create table if not exists lesson_attendance (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  lesson_date date not null,
  status text not null check (status in ('present', 'absent', 'late')),
  reason text check (reason is null or char_length(reason) <= 120),
  marked_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, student_id, lesson_date)
);

create index if not exists lesson_attendance_org_date_idx on lesson_attendance (org_id, lesson_date);
create index if not exists lesson_attendance_student_date_idx on lesson_attendance (student_id, lesson_date);
create index if not exists lesson_attendance_group_date_idx on lesson_attendance (group_id, lesson_date);

drop trigger if exists lesson_attendance_touch on lesson_attendance;
create trigger lesson_attendance_touch before update on lesson_attendance
  for each row execute function public.touch_updated_at();

-- O'qituvchi shu darsni o'tadimi (fan o'qituvchisi) yoki shu sinfning rahbarimi.
create or replace function public.teaches_lesson(p_lesson uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1
    from public.lessons l
    join public.groups g on g.id = l.group_id
    join public.org_members m on m.org_id = l.org_id and m.user_id = auth.uid()
    where l.id = p_lesson
      and public.org_is_active(l.org_id)
      and m.role = 'teacher'
      and m.employee_id is not null
      and (l.teacher_id = m.employee_id or g.teacher_id = m.employee_id)
  );
$fn$;

alter table lesson_attendance enable row level security;

drop policy if exists lesson_attendance_read on lesson_attendance;
create policy lesson_attendance_read on lesson_attendance
  for select using (can_manage_org(org_id) or teaches_group(group_id));

-- Yozuv izchilligi: dars, sinf va o'quvchi bitta tashkilotga tegishli va o'quvchi shu sinfda.
drop policy if exists lesson_attendance_manage on lesson_attendance;
create policy lesson_attendance_manage on lesson_attendance
  for all using (can_manage_org(org_id))
  with check (
    can_manage_org(org_id)
    and exists (
      select 1 from lessons l
      where l.id = lesson_id and l.org_id = lesson_attendance.org_id and l.group_id = lesson_attendance.group_id
    )
    and exists (
      select 1 from students s
      where s.id = student_id and s.org_id = lesson_attendance.org_id and s.group_id = lesson_attendance.group_id
    )
  );

drop policy if exists lesson_attendance_teacher on lesson_attendance;
create policy lesson_attendance_teacher on lesson_attendance
  for all using (teaches_lesson(lesson_id))
  with check (
    teaches_lesson(lesson_id)
    and exists (
      select 1 from lessons l
      where l.id = lesson_id and l.org_id = lesson_attendance.org_id and l.group_id = lesson_attendance.group_id
    )
    and exists (
      select 1 from students s
      where s.id = student_id and s.org_id = lesson_attendance.org_id and s.group_id = lesson_attendance.group_id
    )
  );
