-- 0029_grades.sql
-- Baholar (5 ballik tizim). Har bir baho: o'quvchi, sinf, fan, tur, sana.
-- Boshqaruv hammasini, o'qituvchi faqat o'z sinfini boshqaradi.

create table if not exists grades (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  subject text not null,
  kind text not null check (kind in ('homework', 'quiz', 'midterm', 'exam', 'final')),
  score smallint not null check (score between 1 and 5),
  graded_on date not null default current_date,
  note text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists grades_group_subject_idx on grades (org_id, group_id, subject, graded_on desc);
create index if not exists grades_student_idx on grades (student_id, subject);

alter table grades enable row level security;

drop policy if exists grades_manage on grades;
create policy grades_manage on grades
  for all using (can_manage_org(org_id))
  with check (
    can_manage_org(org_id)
    and exists (
      select 1 from students s
      where s.id = student_id and s.org_id = grades.org_id and s.group_id = grades.group_id
    )
  );

drop policy if exists grades_teacher on grades;
create policy grades_teacher on grades
  for all using (teaches_group(group_id))
  with check (
    teaches_group(group_id)
    and exists (
      select 1 from students s
      where s.id = student_id and s.org_id = grades.org_id and s.group_id = grades.group_id
    )
  );
