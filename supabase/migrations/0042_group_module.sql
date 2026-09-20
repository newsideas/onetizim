-- 0042_group_module.sql
-- Edu tizimdagi "Guruh" bo'limi uchun: guruh holati/darajasi/Telegram havolasi,
-- xonaga sig'im va mas'ul shaxs, jihozlar va ularning xonalarga biriktirilishi,
-- vazifaga maksimal ball.

-- 1) Guruh
alter table groups
  add column if not exists status text not null default 'active',
  add column if not exists level text,
  add column if not exists telegram_url text;

do $$ begin
  alter table groups add constraint groups_status_check
    check (status in ('active', 'waiting', 'archived'));
exception when duplicate_object then null;
end $$;

-- 2) Xona: sig'im, izoh, mas'ul xodim (teachers = barcha xodimlar)
alter table rooms
  add column if not exists capacity integer check (capacity is null or capacity >= 0),
  add column if not exists note text,
  add column if not exists responsible_id uuid references teachers(id) on delete set null;

-- 3) Jihozlar
create sequence if not exists equipment_code_seq;

create table if not exists equipment (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  -- Bo'sh qoldirilsa avtomatik yaratiladi (INV-00001).
  inventory_code text not null
    default ('INV-' || lpad(nextval('equipment_code_seq')::text, 5, '0')),
  unit_price numeric not null default 0 check (unit_price >= 0),
  created_at timestamptz not null default now(),
  unique (org_id, inventory_code)
);

create table if not exists room_equipment (
  org_id uuid not null references organizations(id) on delete cascade,
  room_id uuid not null references rooms(id) on delete cascade,
  equipment_id uuid not null references equipment(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  primary key (room_id, equipment_id)
);

create index if not exists room_equipment_equipment_idx on room_equipment (equipment_id);

alter table equipment enable row level security;
alter table room_equipment enable row level security;

drop policy if exists equipment_read on equipment;
create policy equipment_read on equipment
  for select using (is_org_member(org_id));

drop policy if exists equipment_manage on equipment;
create policy equipment_manage on equipment
  for all using (can_manage_org(org_id))
  with check (can_manage_org(org_id));

drop policy if exists room_equipment_read on room_equipment;
create policy room_equipment_read on room_equipment
  for select using (is_org_member(org_id));

drop policy if exists room_equipment_manage on room_equipment;
create policy room_equipment_manage on room_equipment
  for all using (can_manage_org(org_id))
  with check (
    can_manage_org(org_id)
    and exists (select 1 from rooms r where r.id = room_id and r.org_id = room_equipment.org_id)
    and exists (select 1 from equipment e where e.id = equipment_id and e.org_id = room_equipment.org_id)
  );

-- 4) Vazifa: maksimal ball
alter table homework
  add column if not exists max_score integer check (max_score is null or max_score > 0);
