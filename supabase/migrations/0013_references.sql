-- 0013_references.sql
-- Ma'lumotnomalar (My School: Sozlamalar va O'quv bo'limi).
--
-- Sinflar, dars jadvali, shartnomalar va moliya shu jadvallarga
-- tayanadi, shuning uchun ular birinchi quriladi. Hammasi idempotent:
-- qayta ishga tushirilsa xato bermaydi.

-- O'quv yillari
create table if not exists academic_years (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,                       -- "2025-2026"
  education_type text,                      -- "Kunduzgi", "Kechki" ...
  start_date date,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz default now(),
  unique (org_id, name)
);

-- Sinf / guruh turlari
create table if not exists class_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  code text,
  note text,
  created_at timestamptz default now(),
  unique (org_id, name)
);

-- Smenalar
create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  start_time time,
  end_time time,
  created_at timestamptz default now(),
  unique (org_id, name)
);

-- Ta'lim tillari
create table if not exists academic_languages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz default now(),
  unique (org_id, name)
);

-- Binolar
create table if not exists buildings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  code text,
  address text,
  created_at timestamptz default now(),
  unique (org_id, name)
);

-- Dars vaqtlari (1-para 08:30–09:15 ...)
create table if not exists lesson_times (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  position integer not null,
  start_time time not null,
  end_time time not null,
  shift_id uuid references shifts(id) on delete set null,
  created_at timestamptz default now()
);

-- Akademik davrlar (choraklar, semestrlar)
create table if not exists academic_periods (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  academic_year_id uuid references academic_years(id) on delete cascade,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

-- Mashg'ulot turlari (ma'ruza, amaliyot ...)
create table if not exists training_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  code text,
  note text,
  created_at timestamptz default now(),
  unique (org_id, name)
);

-- Mavjud ma'lumotnomalarni My School ustunlariga kengaytirish
alter table rooms
  add column if not exists code text,
  add column if not exists building_id uuid references buildings(id) on delete set null;

alter table courses
  add column if not exists code text;

-- Sinf: My School'dagi "Sinflar" ro'yxati ustunlari
alter table groups
  add column if not exists code text,
  add column if not exists class_type_id uuid references class_types(id) on delete set null,
  add column if not exists academic_year_id uuid references academic_years(id) on delete set null,
  add column if not exists shift_id uuid references shifts(id) on delete set null,
  add column if not exists language_id uuid references academic_languages(id) on delete set null,
  add column if not exists capacity integer;

-- RLS: har bir muassasa faqat o'z ma'lumotnomalarini ko'radi.
do $$
declare
  t text;
begin
  foreach t in array array[
    'academic_years', 'class_types', 'shifts', 'academic_languages',
    'buildings', 'lesson_times', 'academic_periods', 'training_types'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_all_own_org', t);
    execute format(
      'create policy %I on %I for all using (is_org_owner(org_id)) with check (is_org_owner(org_id))',
      t || '_all_own_org', t
    );
  end loop;
end $$;
