-- 0028_lessons.sql
-- Dars jadvali: sinfning haftalik darslari (fan, o'qituvchi, xona, kun, vaqt).
-- weekday: 1 = Dushanba ... 7 = Yakshanba. Ko'rish: barcha a'zolar,
-- o'zgartirish: direktor va menejer.

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  teacher_id uuid references teachers(id) on delete set null,
  room_id uuid references rooms(id) on delete set null,
  subject text not null,
  weekday smallint not null check (weekday between 1 and 7),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists lessons_org_day_idx on lessons (org_id, weekday, start_time);
create index if not exists lessons_group_idx on lessons (group_id);

alter table lessons enable row level security;

drop policy if exists lessons_read on lessons;
create policy lessons_read on lessons
  for select using (is_org_member(org_id));

drop policy if exists lessons_manage on lessons;
create policy lessons_manage on lessons
  for all using (can_manage_org(org_id))
  with check (
    can_manage_org(org_id)
    and exists (select 1 from groups g where g.id = group_id and g.org_id = lessons.org_id)
    and (teacher_id is null or exists (
      select 1 from teachers t where t.id = teacher_id and t.org_id = lessons.org_id))
    and (room_id is null or exists (
      select 1 from rooms r where r.id = room_id and r.org_id = lessons.org_id))
  );
