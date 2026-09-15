-- schema.sql — toza bazani bir marta o'rnatish uchun to'liq sxema.
--
-- Bu fayl 0001–0009 migratsiyalarining YAKUNIY natijasi. Yangi Supabase
-- loyihasida migratsiyalarni bittalab ishga tushirish o'rniga shuni bir
-- marta SQL Editor'da ishga tushiring.
--
-- Mavjud (ishlab turgan) bazaga qo'llamang — u yerda migratsiyalar
-- ketma-ket qo'llanilgan bo'lishi kerak.

-- ============================================================
-- JADVALLAR
-- ============================================================

-- Muassasa: xususiy maktab, bog'cha yoki o'quv markaz.
-- Bir foydalanuvchi — bitta muassasa (owner_id unique).
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('maktab', 'bogcha', 'markaz')),
  owner_id uuid references auth.users(id) unique,
  created_at timestamptz default now()
);

create table teachers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  full_name text not null,
  phone text,
  salary_type text check (salary_type in ('fixed','per_lesson','percent')),
  rate numeric,
  created_at timestamptz default now()
);

-- Xona (dars jadvali xonalar bo'yicha quriladi)
create table rooms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique (org_id, name)
);

-- Kurs / fan
create table courses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique (org_id, name)
);

-- Guruh / sinf / yosh guruhi (segmentga qarab nomlanadi)
create table groups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  teacher_id uuid references teachers(id) on delete set null,
  room_id uuid references rooms(id) on delete set null,
  course_id uuid references courses(id) on delete set null,
  schedule_days text[],                    -- ['Dushanba','Chorshanba']
  start_time time,
  end_time time,
  lesson_duration_minutes integer,
  education_type text
    check (education_type in ('offline','online'))
    default 'offline',
  start_date date,
  end_date date,
  monthly_price numeric not null default 0,
  created_at timestamptz default now()
);

-- O'quvchi / bola
create table students (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  group_id uuid references groups(id) on delete set null,
  full_name text not null,
  phone text,
  parent_telegram_chat_id bigint,
  balance numeric not null default 0,      -- manfiy = qarzdor
  status text default 'active'
    check (status in ('active','frozen','archived')),
  created_at timestamptz default now()
);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  lesson_date date not null,
  status text check (status in ('present','absent','late')),
  marked_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique (student_id, lesson_date)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  amount numeric not null,
  method text check (method in ('naqd','karta','click','payme')),
  paid_at date not null default current_date,
  note text,
  created_at timestamptz default now()
);

-- Oylik hisob (qarzdorlik manbai). unique — bir oy ikki marta hisoblanmaydi.
create table charges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  group_id uuid references groups(id) on delete set null,
  period date not null,                    -- oyning 1-sanasi
  amount numeric not null,
  created_at timestamptz default now(),
  unique (student_id, period)
);

create table telegram_links (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  chat_id bigint not null,
  linked_at timestamptz default now(),
  unique (student_id, chat_id)
);

-- ============================================================
-- YORDAMCHI FUNKSIYA
-- ============================================================

-- Berilgan muassasa joriy foydalanuvchiga tegishlimi?
-- Barcha RLS policy'lar shunga tayanadi.
create or replace function public.is_org_owner(check_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from organizations
    where id = check_org_id and owner_id = auth.uid()
  );
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table organizations enable row level security;
alter table teachers enable row level security;
alter table rooms enable row level security;
alter table courses enable row level security;
alter table groups enable row level security;
alter table students enable row level security;
alter table attendance enable row level security;
alter table payments enable row level security;
alter table charges enable row level security;
alter table telegram_links enable row level security;

create policy "organizations_select_own" on organizations
  for select using (owner_id = auth.uid());
create policy "organizations_insert_own" on organizations
  for insert with check (owner_id = auth.uid());
create policy "organizations_update_own" on organizations
  for update using (owner_id = auth.uid());
create policy "organizations_delete_own" on organizations
  for delete using (owner_id = auth.uid());

create policy "teachers_all_own_org" on teachers
  for all using (is_org_owner(org_id)) with check (is_org_owner(org_id));

create policy "rooms_all_own_org" on rooms
  for all using (is_org_owner(org_id)) with check (is_org_owner(org_id));

create policy "courses_all_own_org" on courses
  for all using (is_org_owner(org_id)) with check (is_org_owner(org_id));

create policy "groups_all_own_org" on groups
  for all using (is_org_owner(org_id)) with check (is_org_owner(org_id));

create policy "students_all_own_org" on students
  for all using (is_org_owner(org_id)) with check (is_org_owner(org_id));

create policy "attendance_all_own_org" on attendance
  for all using (
    exists (select 1 from groups g where g.id = group_id and is_org_owner(g.org_id))
  ) with check (
    exists (select 1 from groups g where g.id = group_id and is_org_owner(g.org_id))
  );

create policy "payments_all_own_org" on payments
  for all using (
    exists (select 1 from students s where s.id = student_id and is_org_owner(s.org_id))
  ) with check (
    exists (select 1 from students s where s.id = student_id and is_org_owner(s.org_id))
  );

create policy "charges_all_own_org" on charges
  for all using (
    exists (select 1 from students s where s.id = student_id and is_org_owner(s.org_id))
  ) with check (
    exists (select 1 from students s where s.id = student_id and is_org_owner(s.org_id))
  );

create policy "telegram_links_all_own_org" on telegram_links
  for all using (
    exists (select 1 from students s where s.id = student_id and is_org_owner(s.org_id))
  ) with check (
    exists (select 1 from students s where s.id = student_id and is_org_owner(s.org_id))
  );

-- ============================================================
-- BALANS TRIGGERLARI
-- ============================================================

-- To'lov kiritilganda balans oshadi.
create or replace function public.apply_payment_to_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update students
  set balance = balance + new.amount
  where id = new.student_id;
  return new;
end;
$$;

create trigger trg_apply_payment_to_balance
after insert on payments
for each row
execute function apply_payment_to_balance();

-- Oylik hisob yozilganda balans kamayadi.
create or replace function public.apply_charge_to_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update students
  set balance = balance - new.amount
  where id = new.student_id;
  return new;
end;
$$;

create trigger trg_apply_charge_to_balance
after insert on charges
for each row
execute function apply_charge_to_balance();

-- ============================================================
-- OYLIK HISOBNI YOPISH
-- ============================================================

-- Tanlangan oy uchun barcha aktiv o'quvchilarga hisob yozadi.
-- Muassasa id'si parametrdan emas, auth.uid() orqali topiladi —
-- shunda boshqa muassasaga hisob yozib bo'lmaydi.
create or replace function public.charge_monthly_fees(p_period date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_inserted integer;
begin
  select id into v_org_id
  from organizations
  where owner_id = auth.uid();

  if v_org_id is null then
    raise exception 'Tashkilot topilmadi';
  end if;

  insert into charges (student_id, group_id, period, amount)
  select s.id, s.group_id, date_trunc('month', p_period)::date, g.monthly_price
  from students s
  join groups g on g.id = s.group_id
  where s.org_id = v_org_id
    and s.status = 'active'
    and g.monthly_price > 0
  on conflict (student_id, period) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

-- ============================================================
-- TELEGRAM
-- ============================================================

-- Ota-onaning Telegram chat'ini o'quvchiga bog'laydi.
-- Webhook'da sessiya bo'lmaydi, shuning uchun security definer.
-- Qo'shimcha himoya: webhook route Telegram'ning secret_token'ini tekshiradi.
create or replace function public.link_telegram_chat(
  p_student_id uuid,
  p_chat_id bigint
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
begin
  select full_name into v_full_name
  from students
  where id = p_student_id and status = 'active';

  if v_full_name is null then
    return null;
  end if;

  insert into telegram_links (student_id, chat_id)
  values (p_student_id, p_chat_id)
  on conflict (student_id, chat_id) do nothing;

  update students
  set parent_telegram_chat_id = p_chat_id
  where id = p_student_id;

  return v_full_name;
end;
$$;

grant execute on function public.link_telegram_chat(uuid, bigint) to anon;
