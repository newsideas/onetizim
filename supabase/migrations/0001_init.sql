-- 0001_init.sql
-- To'garak/Maktab CRM — boshlang'ich sxema

-- organizations: bitta to'garak yoki maktab
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('togarak','maktab')),
  owner_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- teachers
create table teachers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id),
  full_name text not null,
  phone text,
  salary_type text check (salary_type in ('fixed','per_lesson','percent')),
  rate numeric,
  created_at timestamptz default now()
);

-- groups: bitta to'garak/sinf guruhi
create table groups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id),
  name text not null,
  subject text,
  teacher_id uuid references teachers(id),
  room text,
  schedule_days text[],        -- masalan: ['Dushanba','Chorshanba','Juma']
  start_time time,
  end_time time,
  monthly_price numeric not null default 0,
  created_at timestamptz default now()
);

-- students
create table students (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id),
  group_id uuid references groups(id),
  full_name text not null,
  phone text,
  parent_telegram_chat_id bigint,
  balance numeric not null default 0,   -- manfiy = qarzdor
  status text default 'active' check (status in ('active','archived')),
  created_at timestamptz default now()
);

-- attendance
create table attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id),
  group_id uuid references groups(id),
  lesson_date date not null,
  status text check (status in ('present','absent','late')),
  marked_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique (student_id, lesson_date)
);

-- payments
create table payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id),
  amount numeric not null,
  method text check (method in ('naqd','karta','click','payme')),
  paid_at date not null default current_date,
  note text,
  created_at timestamptz default now()
);

-- telegram_links: ota-ona botni ulaganda yoziladi
create table telegram_links (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id),
  chat_id bigint not null,
  linked_at timestamptz default now()
);

-- Row Level Security — har bir tashkilot faqat o'z ma'lumotini ko'radi.
-- (RLS policy'lar auth oqimi qurilgan bosqichda to'ldiriladi.)
alter table organizations enable row level security;
alter table teachers enable row level security;
alter table groups enable row level security;
alter table students enable row level security;
alter table attendance enable row level security;
alter table payments enable row level security;
alter table telegram_links enable row level security;
