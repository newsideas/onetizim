-- 0008_rooms_courses.sql
-- Xona va kurs/fan endi alohida obyekt (avval groups ichida oddiy matn edi).
--
-- Nega kerak: xonalar bo'yicha dars jadvali qurish, bir xil nomning turlicha
-- yozilishini (masalan "205-xona" va "205 xona") oldini olish va keyinchalik
-- xonaga sig'im, kursga narx/dastur qo'shish uchun.
--
-- Mavjud matn qiymatlari avtomatik ko'chiriladi — ma'lumot yo'qolmaydi.

create table rooms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique (org_id, name)
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique (org_id, name)
);

alter table rooms enable row level security;
alter table courses enable row level security;

create policy "rooms_all_own_org" on rooms
  for all using (is_org_owner(org_id)) with check (is_org_owner(org_id));

create policy "courses_all_own_org" on courses
  for all using (is_org_owner(org_id)) with check (is_org_owner(org_id));

alter table groups
  add column room_id uuid references rooms(id) on delete set null,
  add column course_id uuid references courses(id) on delete set null;

-- 1) Mavjud nomlarni yangi jadvallarga ko'chirish
insert into rooms (org_id, name)
select distinct org_id, trim(room)
from groups
where room is not null and trim(room) <> ''
on conflict (org_id, name) do nothing;

insert into courses (org_id, name)
select distinct org_id, trim(subject)
from groups
where subject is not null and trim(subject) <> ''
on conflict (org_id, name) do nothing;

-- 2) Guruhlarni yangi yozuvlarga bog'lash
update groups g
set room_id = r.id
from rooms r
where r.org_id = g.org_id and r.name = trim(g.room);

update groups g
set course_id = c.id
from courses c
where c.org_id = g.org_id and c.name = trim(g.subject);

-- 3) Eski matn ustunlari endi keraksiz
alter table groups drop column room;
alter table groups drop column subject;
