-- 0045_edu_lists.sql
-- Edu tizimdagi oddiy ro'yxat sahifalari uchun jadvallar: kurs kategoriyalari,
-- onlayn kurslar, shartnoma shablonlari, qabul test bazasi, blok testlar,
-- tranzaksiya turlari, rejalashtirilgan xarajatlar, savdo rejasi, yangiliklar,
-- hikoyalar, marketing, filiallar, ish jadvallari.
-- Ko'rish: barcha a'zolar; o'zgartirish: direktor va administrator.

create table if not exists course_categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Kurs: rang va kategoriya (Oflayn kurslar sahifasi)
alter table courses
  add column if not exists color text,
  add column if not exists category_id uuid references course_categories(id) on delete set null;

create table if not exists online_courses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists contract_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  number text,
  title text not null,
  type_id uuid references contract_types(id) on delete set null,
  body text,
  created_at timestamptz not null default now()
);

create table if not exists admission_tests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  course_id uuid references courses(id) on delete set null,
  questions_count integer,
  questions_per_test integer,
  minutes integer,
  score_per_question numeric,
  status text not null default 'Faol',
  created_at timestamptz not null default now()
);

create table if not exists block_test_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  code text,
  minutes integer,
  questions_count integer,
  score_per_answer numeric,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists block_tests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  type_id uuid references block_test_types(id) on delete set null,
  status text not null default 'Rejalashtirilgan',
  test_date date,
  start_time time,
  minutes integer,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists transaction_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  kind text not null default 'Kirim',
  created_at timestamptz not null default now()
);

create table if not exists planned_expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  amount numeric not null default 0,
  due_date date,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists sales_plans (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  plan_month date not null,
  target_leads integer,
  target_students integer,
  target_revenue numeric,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists news_posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  body text,
  published_on date,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  image_url text,
  link_url text,
  expires_on date,
  created_at timestamptz not null default now()
);

create table if not exists marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  channel text,
  budget numeric,
  start_date date,
  end_date date,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists work_schedules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  start_time time not null,
  end_time time not null,
  work_days text,
  note text,
  created_at timestamptz not null default now()
);

-- RLS: a'zolar ko'radi, direktor va administrator o'zgartiradi.
do $$
declare
  t text;
begin
  foreach t in array array[
    'course_categories', 'online_courses', 'contract_templates', 'admission_tests',
    'block_test_types', 'block_tests', 'transaction_types', 'planned_expenses',
    'sales_plans', 'news_posts', 'stories', 'marketing_campaigns', 'branches',
    'work_schedules'
  ]
  loop
    execute format('create index if not exists %I on %I (org_id)', t || '_org_idx', t);
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_read', t);
    execute format('create policy %I on %I for select using (is_org_member(org_id))', t || '_read', t);
    execute format('drop policy if exists %I on %I', t || '_manage', t);
    execute format(
      'create policy %I on %I for all using (can_manage_org(org_id)) with check (can_manage_org(org_id))',
      t || '_manage', t
    );
  end loop;
end $$;
