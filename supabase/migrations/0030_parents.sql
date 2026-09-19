-- 0030_parents.sql
-- Ota-ona alohida entity: bitta ota-onada bir nechta farzand bo'lishi mumkin.
-- O'quvchi kartasidagi parent_* maydonlari shartnoma uchun qoladi;
-- mavjud yozuvlar bir marta ota-onalar jadvaliga ko'chiriladi.

create table if not exists parents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  relation text,
  phone text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists parents_org_name_idx on parents (org_id, full_name);

create table if not exists student_parents (
  student_id uuid not null references students(id) on delete cascade,
  parent_id uuid not null references parents(id) on delete cascade,
  primary key (student_id, parent_id)
);

create index if not exists student_parents_parent_idx on student_parents (parent_id);

alter table parents enable row level security;
alter table student_parents enable row level security;

drop policy if exists parents_manage on parents;
create policy parents_manage on parents
  for all using (can_manage_org(org_id)) with check (can_manage_org(org_id));

drop policy if exists student_parents_manage on student_parents;
create policy student_parents_manage on student_parents
  for all using (
    exists (select 1 from parents p where p.id = parent_id and can_manage_org(p.org_id))
  ) with check (
    exists (
      select 1 from parents p
      join students s on s.id = student_id and s.org_id = p.org_id
      where p.id = parent_id and can_manage_org(p.org_id)
    )
  );

do $$
begin
  if not exists (select 1 from parents) then
    with src as (
      select distinct on (org_id, parent_full_name, coalesce(parent_phone, ''))
        org_id, parent_full_name, parent_relation, parent_phone
      from students
      where coalesce(trim(parent_full_name), '') <> ''
      order by org_id, parent_full_name, coalesce(parent_phone, ''), created_at
    ), ins as (
      insert into parents (org_id, full_name, relation, phone)
      select org_id, parent_full_name, parent_relation, parent_phone from src
      returning id, org_id, full_name, phone
    )
    insert into student_parents (student_id, parent_id)
    select s.id, i.id from students s
    join ins i on i.org_id = s.org_id and i.full_name = s.parent_full_name
      and coalesce(i.phone, '') = coalesce(s.parent_phone, '')
    on conflict do nothing;
  end if;
end $$;
