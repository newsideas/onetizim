-- YANGI MIGRATSIYALAR: 0044 - 0072.
-- Supabase Dashboard -> SQL Editor -> New query: shu faylni to'liq joylab Run bosing (bir marta).
-- Hammasi qayta ishga tushirilsa ham zarar qilmaydi (if not exists / drop policy if exists).

-- ================= 0044_tasks.sql =================
-- 0044_tasks.sql
-- Topshiriqlar (Edu tizimdagi "Topshiriqlar" bo'limi): xodimga sana/vaqt bilan
-- biriktiriladigan vazifalar — qo'ng'iroq, uchrashuv, eslatma va h.k.
-- Ko'rish: barcha a'zolar; yaratish/o'zgartirish: direktor va administrator.

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  due_date date not null,
  due_time time,
  task_type text not null default 'other'
    check (task_type in ('call', 'meeting', 'message', 'payment', 'other')),
  assignee_id uuid references teachers(id) on delete set null,
  note text,
  done_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists tasks_org_due_idx on tasks (org_id, due_date, due_time);
create index if not exists tasks_assignee_idx on tasks (assignee_id);

alter table tasks enable row level security;

drop policy if exists tasks_read on tasks;
create policy tasks_read on tasks
  for select using (is_org_member(org_id));

drop policy if exists tasks_manage on tasks;
create policy tasks_manage on tasks
  for all using (can_manage_org(org_id))
  with check (
    can_manage_org(org_id)
    and (assignee_id is null or exists (
      select 1 from teachers t where t.id = assignee_id and t.org_id = tasks.org_id))
  );

-- ================= 0045_edu_lists.sql =================
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

-- ================= 0046_staff_money_feedback.sql =================
-- 0046_staff_money_feedback.sql
-- Xodimlarga bonus va jarima (Moliya → Amallar) hamda fikr-mulohaza (Nazorat).
-- Ko'rish: barcha a'zolar; o'zgartirish: direktor va administrator.

create table if not exists staff_bonuses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  employee_id uuid references teachers(id) on delete set null,
  amount numeric not null check (amount > 0),
  reason text,
  given_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists staff_fines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  employee_id uuid references teachers(id) on delete set null,
  amount numeric not null check (amount > 0),
  reason text,
  given_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  author_name text not null,
  about_employee_id uuid references teachers(id) on delete set null,
  rating text,
  comment text,
  given_on date not null default current_date,
  created_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array['staff_bonuses', 'staff_fines', 'feedback']
  loop
    execute format('create index if not exists %I on %I (org_id, created_at desc)', t || '_org_idx', t);
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

-- ================= 0047_assessments.sql =================
-- 0047_assessments.sql
-- Mavsumiy baholash (Edu tizimdagi "O'quv bo'limi → Mavsumiy baholash"):
-- o'quvchining guruhdagi oylik/mavsumiy bahosi va izohi.
-- Ko'rish: barcha a'zolar; o'zgartirish: direktor va administrator.

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  group_id uuid references groups(id) on delete set null,
  assessed_on date not null default current_date,
  score numeric not null check (score >= 0),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists assessments_org_date_idx on assessments (org_id, assessed_on desc);

alter table assessments enable row level security;

drop policy if exists assessments_read on assessments;
create policy assessments_read on assessments
  for select using (is_org_member(org_id));

drop policy if exists assessments_manage on assessments;
create policy assessments_manage on assessments
  for all using (can_manage_org(org_id))
  with check (
    can_manage_org(org_id)
    and exists (select 1 from students s where s.id = student_id and s.org_id = assessments.org_id)
  );

-- ================= 0048_gamification_app_settings.sql =================
-- 0048_gamification_app_settings.sql
-- Sozlamalar → Gamifikatsiya (ball qoidalari) va Ilova sozlamalari (kalit-qiymat).
-- Ko'rish: barcha a'zolar; o'zgartirish: direktor va administrator.

create table if not exists gamification_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  points integer not null default 0,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists app_settings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  setting_key text not null,
  setting_value text,
  note text,
  created_at timestamptz not null default now(),
  unique (org_id, setting_key)
);

do $$
declare
  t text;
begin
  foreach t in array array['gamification_rules', 'app_settings']
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

-- ================= 0049_student_archive_reason.sql =================
-- 0049_student_archive_reason.sql
-- "Ketish sabablari" hisoboti uchun: o'quvchi arxivlanganda sabab saqlanadi.
-- Sabab ixtiyoriy; eski arxivlanganlarda bo'sh qoladi.

alter table students add column if not exists archive_reason text;



-- ================= 0050_cancelled_payments.sql =================
-- 0050_cancelled_payments.sql
-- Bekor qilingan to'lovlar: to'lov bekor qilinganda payments'dan o'chiriladi va shu
-- jadvalga ko'chiriladi. Shunda barcha tushum hisobotlari avtomatik to'g'ri qoladi,
-- o'quvchi balansi esa trigger orqali qaytariladi.
-- Ko'rish: barcha a'zolar; o'zgartirish: direktor va administrator.

create table if not exists cancelled_payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  student_id uuid references students(id) on delete set null,
  student_name text,
  amount numeric not null,
  method text,
  paid_at date,
  note text,
  reason text,
  cancelled_at timestamptz not null default now(),
  cancelled_by uuid references auth.users(id) on delete set null default auth.uid()
);

create index if not exists cancelled_payments_org_idx on cancelled_payments (org_id, cancelled_at desc);

alter table cancelled_payments enable row level security;

drop policy if exists cancelled_payments_read on cancelled_payments;
create policy cancelled_payments_read on cancelled_payments
  for select using (is_org_member(org_id));

drop policy if exists cancelled_payments_manage on cancelled_payments;
create policy cancelled_payments_manage on cancelled_payments
  for all using (can_manage_org(org_id)) with check (can_manage_org(org_id));

-- To'lov o'chirilganda o'quvchi balansi qaytariladi (0004 dagi trigger'ning teskarisi).
create or replace function public.reverse_payment_on_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update students
  set balance = balance - old.amount
  where id = old.student_id;
  return old;
end;
$$;

drop trigger if exists trg_reverse_payment_on_delete on payments;
create trigger trg_reverse_payment_on_delete
after delete on payments
for each row execute function reverse_payment_on_delete();


-- ================= 0051_turnstile_support.sql =================
-- 0051_turnstile_support.sql
-- Turniket kirish-chiqish voqealari (qurilma yoki qo'lda kiritiladi) va support murojaatlari.
-- Ko'rish: barcha a'zolar; o'zgartirish: direktor va administrator.

create table if not exists turnstile_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  student_id uuid references students(id) on delete set null,
  direction text not null default 'Kirish' check (direction in ('Kirish', 'Chiqish')),
  event_date date not null default current_date,
  event_time time not null default localtime,
  device text,
  created_at timestamptz not null default now()
);

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  author_name text not null,
  subject text not null,
  description text,
  status text not null default 'Yangi' check (status in ('Yangi', 'Jarayonda', 'Yopilgan')),
  created_on date not null default current_date,
  closed_on date,
  created_at timestamptz not null default now()
);

do $$
declare
  t text;
begin
  foreach t in array array['turnstile_events', 'support_tickets']
  loop
    execute format('create index if not exists %I on %I (org_id, created_at desc)', t || '_org_idx', t);
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


-- ================= 0052_student_quick_fields.sql =================
-- 0052_student_quick_fields.sql
-- Edu tizimdagi "Yangi o'quvchi qo'shish" oynasi maydonlari: elektron pochta, kategoriya,
-- pul to'lash sanasi, marketing so'rovnomasi, o'qish tili, ota va onaning ma'lumotlari.
-- Hammasi ixtiyoriy (nullable), eski o'quvchilarga ta'sir qilmaydi.

alter table students
  add column if not exists email text,
  add column if not exists category_id uuid references course_categories(id) on delete set null,
  add column if not exists payment_date date,
  add column if not exists marketing_campaign_id uuid references marketing_campaigns(id) on delete set null,
  add column if not exists study_language text,
  add column if not exists father_phone text,
  add column if not exists mother_name text,
  add column if not exists mother_phone text;


-- ================= 0053_course_branch_prices.sql =================
-- 0053_course_branch_prices.sql
-- Edu tizimdagi kurs formasi: kurs qaysi filiallarda o'qitilishi va har bir filialdagi bitta dars narxi.
-- Ko'rish: barcha a'zolar; o'zgartirish: direktor va administrator.

-- Edu tizimdagidek har bir markazda kamida bitta filial bo'ladi: bo'sh markazlarga markaz nomi bilan qo'shamiz.
insert into branches (org_id, name)
select o.id, o.name
from organizations o
where not exists (select 1 from branches b where b.org_id = o.id);

create table if not exists course_branch_prices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  branch_id uuid not null references branches(id) on delete cascade,
  available boolean not null default true,
  price numeric not null default 0 check (price >= 0),
  created_at timestamptz not null default now(),
  unique (course_id, branch_id)
);

create index if not exists course_branch_prices_org_idx on course_branch_prices (org_id);

alter table course_branch_prices enable row level security;

drop policy if exists course_branch_prices_read on course_branch_prices;
create policy course_branch_prices_read on course_branch_prices
  for select using (is_org_member(org_id));

drop policy if exists course_branch_prices_manage on course_branch_prices;
create policy course_branch_prices_manage on course_branch_prices
  for all using (can_manage_org(org_id)) with check (can_manage_org(org_id));


-- ================= 0054_lead_order_fields.sql =================
-- 0054_lead_order_fields.sql
-- Edu tizimdagi "Yangi buyurtma" oynasi maydonlari: referal bergan o'quvchi, dars kuni va vaqti,
-- o'qituvchi, yig'ilayotgan guruh va birinchi darsga kelish vaqti. Hammasi ixtiyoriy.

alter table leads
  add column if not exists referral_student_id uuid references students(id) on delete set null,
  add column if not exists lesson_days text
    check (lesson_days is null or lesson_days in ('Juft kunlar', 'Toq kunlar', 'Boshqa kunlar')),
  add column if not exists lesson_time time,
  add column if not exists teacher_id uuid references teachers(id) on delete set null,
  add column if not exists group_id uuid references groups(id) on delete set null,
  add column if not exists trial_time time;


-- ================= 0055_teacher_details.sql =================
-- 0055_teacher_details.sql
-- Edu tizimdagi "Xodim qo'shish" oynasi maydonlari: jinsi, tug'ilgan sanasi, ish haqi chiqarish belgisi,
-- ish jadvali, izoh va elektron pochta. Hammasi ixtiyoriy (eski xodimlarga ta'sir qilmaydi).

alter table teachers
  add column if not exists gender text check (gender is null or gender in ('Erkak', 'Ayol')),
  add column if not exists birth_date date,
  add column if not exists pays_salary boolean not null default true,
  add column if not exists work_schedule_id uuid references work_schedules(id) on delete set null,
  add column if not exists comment text,
  add column if not exists email text;


-- ================= 0056_payment_method_terminal.sql =================
-- 0056_payment_method_terminal.sql
-- Edu tizimda to'lov turlari: Naqd, Plastik, Terminal. "Plastik" bizda mavjud 'karta' qiymati,
-- "Terminal" esa yangi qiymat. Eski qiymatlar (click, payme) o'zgarmaydi.

do $$
declare
  t text;
  c record;
begin
  foreach t in array array['payments', 'expenses', 'salary_payouts']
  loop
    -- Jadvaldagi "method" ustuniga tegishli eski cheklovni topib olib tashlaymiz.
    for c in
      select con.conname
      from pg_constraint con
      where con.conrelid = format('public.%I', t)::regclass
        and con.contype = 'c'
        and pg_get_constraintdef(con.oid) ilike '%method%'
    loop
      execute format('alter table %I drop constraint %I', t, c.conname);
    end loop;

    execute format(
      'alter table %I add constraint %I check (method in (''naqd'', ''karta'', ''click'', ''payme'', ''terminal''))',
      t, t || '_method_check'
    );
  end loop;
end $$;

-- Kassa qoldig'i endi "terminal" usulini ham ko'rsatadi.
create or replace function public.cash_balance_by_method()
returns table (method text, income numeric, outcome numeric)
language sql
stable
security invoker
set search_path = public
as $fn$
  with income as (
    select p.method, sum(p.amount) as total from payments p group by p.method
  ),
  outcome as (
    select x.method, sum(x.amount) as total
    from (
      select e.method, e.amount from expenses e
      union all
      select s.method, s.amount from salary_payouts s
    ) x
    group by x.method
  )
  select m.method, coalesce(i.total, 0), coalesce(o.total, 0)
  from (values ('naqd'), ('karta'), ('terminal'), ('click'), ('payme')) as m(method)
  left join income i on i.method = m.method
  left join outcome o on o.method = m.method;
$fn$;


-- ================= 0057_cashboxes.sql =================
-- 0057_cashboxes.sql
-- Edu tizimdagidek ko'p kassa: kassalar, kassalar orasida ko'chirish va har bir to'lov/xarajat/oylikning kassasi.
-- Kassa ko'rsatilmagan yozuvlar avtomatik tashkilotning birinchi kassasiga (asosiy kassa) tushadi.
-- Ko'rish: barcha a'zolar; o'zgartirish: direktor va administrator.

create table if not exists cashboxes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  moderator_id uuid references teachers(id) on delete set null,
  accepts_online boolean not null default false,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists cashboxes_org_idx on cashboxes (org_id, created_at);

create table if not exists cash_transfers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  from_cashbox_id uuid not null references cashboxes(id) on delete restrict,
  to_cashbox_id uuid not null references cashboxes(id) on delete restrict,
  amount numeric not null check (amount > 0),
  method text not null default 'naqd'
    check (method in ('naqd', 'karta', 'click', 'payme', 'terminal')),
  transfer_date date not null default current_date,
  note text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  check (from_cashbox_id <> to_cashbox_id)
);

create index if not exists cash_transfers_org_idx on cash_transfers (org_id, transfer_date desc);

do $$
declare
  t text;
begin
  foreach t in array array['cashboxes', 'cash_transfers']
  loop
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

-- To'lov, xarajat va oylik endi kassaga bog'lanadi.
alter table payments add column if not exists cashbox_id uuid references cashboxes(id) on delete set null;
alter table expenses add column if not exists cashbox_id uuid references cashboxes(id) on delete set null;
alter table salary_payouts add column if not exists cashbox_id uuid references cashboxes(id) on delete set null;

create index if not exists payments_cashbox_idx on payments (cashbox_id);
create index if not exists expenses_cashbox_idx on expenses (cashbox_id);
create index if not exists salary_payouts_cashbox_idx on salary_payouts (cashbox_id);

-- Har bir tashkilotda kamida bitta kassa bo'ladi.
insert into cashboxes (org_id, name)
select o.id, 'Asosiy kassa'
from organizations o
where not exists (select 1 from cashboxes c where c.org_id = o.id);

-- Kassa ko'rsatilmasa, tashkilotning birinchi faol kassasi tanlanadi (yo'q bo'lsa yaratiladi).
create or replace function public.default_cashbox(p_org uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_id uuid;
begin
  select id into v_id
  from cashboxes
  where org_id = p_org and not is_archived
  order by created_at
  limit 1;

  if v_id is null then
    insert into cashboxes (org_id, name) values (p_org, 'Asosiy kassa') returning id into v_id;
  end if;
  return v_id;
end;
$fn$;

create or replace function public.assign_default_cashbox()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_org uuid;
begin
  if new.cashbox_id is not null then
    return new;
  end if;

  if tg_table_name = 'payments' then
    select s.org_id into v_org from students s where s.id = new.student_id;
  else
    v_org := new.org_id;
  end if;

  if v_org is not null then
    new.cashbox_id := default_cashbox(v_org);
  end if;
  return new;
end;
$fn$;

drop trigger if exists trg_payments_default_cashbox on payments;
create trigger trg_payments_default_cashbox
before insert on payments
for each row execute function assign_default_cashbox();

drop trigger if exists trg_expenses_default_cashbox on expenses;
create trigger trg_expenses_default_cashbox
before insert on expenses
for each row execute function assign_default_cashbox();

drop trigger if exists trg_salary_payouts_default_cashbox on salary_payouts;
create trigger trg_salary_payouts_default_cashbox
before insert on salary_payouts
for each row execute function assign_default_cashbox();

-- Mavjud yozuvlarni asosiy kassaga bog'laymiz.
update payments p
set cashbox_id = default_cashbox(s.org_id)
from students s
where p.student_id = s.id and p.cashbox_id is null and s.org_id is not null;

update expenses set cashbox_id = default_cashbox(org_id) where cashbox_id is null;
update salary_payouts set cashbox_id = default_cashbox(org_id) where cashbox_id is null;

-- Kassalar qoldig'i: kirim = to'lovlar + kelgan ko'chirishlar, chiqim = xarajat + oylik + ketgan ko'chirishlar.
create or replace function public.cashbox_balances()
returns table (cashbox_id uuid, income numeric, outcome numeric)
language sql
stable
security invoker
set search_path = public
as $fn$
  select
    c.id,
    coalesce((select sum(p.amount) from payments p where p.cashbox_id = c.id), 0)
      + coalesce((select sum(t.amount) from cash_transfers t where t.to_cashbox_id = c.id), 0),
    coalesce((select sum(e.amount) from expenses e where e.cashbox_id = c.id), 0)
      + coalesce((select sum(s.amount) from salary_payouts s where s.cashbox_id = c.id), 0)
      + coalesce((select sum(t.amount) from cash_transfers t where t.from_cashbox_id = c.id), 0)
  from cashboxes c;
$fn$;


-- ================= 0058_bonus_fine_type.sql =================
-- 0058_bonus_fine_type.sql
-- Edu tizimdagi Bonus va Jarima oynalarida "Tranzaksiya turi" tanlanadi.
-- Xodim bonusi/jarimasi jadvallariga tur ustuni qo'shiladi (ixtiyoriy).

alter table staff_bonuses
  add column if not exists transaction_type_id uuid references transaction_types(id) on delete set null;

alter table staff_fines
  add column if not exists transaction_type_id uuid references transaction_types(id) on delete set null;


-- ================= 0059_planned_expense_schedule.sql =================
-- 0059_planned_expense_schedule.sql
-- Edu tizimdagi "Rejalashtirilgan xarajatlar": takrorlanuvchi reja — turi (kunlik/oylik), holati,
-- boshlanish va tugash sanasi. Eski ustunlar (due_date, note) o'zgarishsiz qoladi.

alter table planned_expenses
  add column if not exists kind text check (kind is null or kind in ('Kunlik', 'Oylik')),
  add column if not exists status text check (status is null or status in ('Aktiv', 'Nofaol')),
  add column if not exists start_date date,
  add column if not exists end_date date;


-- ================= 0060_transaction_type_details.sql =================
-- 0060_transaction_type_details.sql
-- Edu tizimdagi "Tranzaksiya turini qo'shish" oynasi: rang, yuqori tranzaksiya, minimal/maksimal miqdor
-- va mijoz turi. Hammasi ixtiyoriy; eski tranzaksiya turlariga ta'sir qilmaydi.

alter table transaction_types
  add column if not exists color text,
  add column if not exists parent_id uuid references transaction_types(id) on delete set null,
  add column if not exists min_amount numeric check (min_amount is null or min_amount >= 0),
  add column if not exists max_amount numeric check (max_amount is null or max_amount >= 0),
  add column if not exists client_type text
    check (client_type is null or client_type in ('Boshqa', 'O''quvchilar', 'Xodim', 'Uchinchi shaxs'));


-- ================= 0061_edu_forms_columns.sql =================
-- 0061_edu_forms_columns.sql
-- Edu tizimdagi oynalar maydonlari: Filial, Marketing so'rovnomasi, Yangilik, Blok test.
-- Hammasi ixtiyoriy (nullable yoki default bilan); eski yozuvlarga ta'sir qilmaydi.

-- Filiallar: radius, koordinatalar, sig'im va IELTS havolasi.
alter table branches
  add column if not exists radius numeric,
  add column if not exists lat numeric,
  add column if not exists lng numeric,
  add column if not exists max_groups integer,
  add column if not exists max_students integer,
  add column if not exists ielts_link text;

-- Marketing so'rovnomasi: sarlavha (name), subtitr, miqdor, til, ko'rsatish va filial.
alter table marketing_campaigns
  add column if not exists subtitle text,
  add column if not exists amount numeric,
  add column if not exists language text,
  add column if not exists is_shown boolean not null default true,
  add column if not exists branch_id uuid references branches(id) on delete set null;

-- Yangiliklar: kimlar uchun.
alter table news_posts
  add column if not exists for_students boolean not null default true,
  add column if not exists for_parents boolean not null default false,
  add column if not exists for_employees boolean not null default false;

-- Blok test: guruh va mas'ul xodim.
alter table block_tests
  add column if not exists group_id uuid references groups(id) on delete set null,
  add column if not exists responsible_id uuid references teachers(id) on delete set null;


-- ================= 0062_sms_templates.sql =================
-- 0062_sms_templates.sql
-- Edu tizimdagi "SMS shablonlari": turi, sarlavha va SMS matni. Yuborish provayderi ulanmagan bo'lsa ham shablonlar saqlanadi.

create table if not exists sms_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  kind text not null,
  title text,
  body text,
  created_at timestamptz not null default now()
);

create index if not exists sms_templates_org_idx on sms_templates (org_id);
alter table sms_templates enable row level security;

drop policy if exists sms_templates_read on sms_templates;
create policy sms_templates_read on sms_templates for select using (is_org_member(org_id));

drop policy if exists sms_templates_manage on sms_templates;
create policy sms_templates_manage on sms_templates for all
  using (can_manage_org(org_id)) with check (can_manage_org(org_id));


-- ================= 0063_custom_roles.sql =================
-- 0063_custom_roles.sql
-- Edu tizimdagi "Rollar": markaz o'zi nom, izoh va ruxsatlar bilan rol yaratadi.
-- Bazadagi haqiqiy himoya (RLS) asosiy rolga (base_role) tayanadi; maxsus rol ruxsatlarni faqat
-- shu asosiy rol doirasida kamaytiradi, kengaytira olmaydi.

create table if not exists org_roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  comment text,
  base_role org_role not null default 'manager' check (base_role <> 'owner'),
  permissions text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists org_roles_org_idx on org_roles (org_id);
alter table org_roles enable row level security;

drop policy if exists org_roles_read on org_roles;
create policy org_roles_read on org_roles for select using (is_org_member(org_id));

drop policy if exists org_roles_manage on org_roles;
create policy org_roles_manage on org_roles for all
  using (can_manage_org(org_id)) with check (can_manage_org(org_id));

alter table org_members
  add column if not exists custom_role_id uuid references org_roles(id) on delete set null;


-- ================= 0064_platform_billing.sql =================
-- 0064_platform_billing.sql
-- Super admin CRM: markazlarning platformaga to'lovlari, obuna tugash sanasi (paid_until)
-- va markazlar ro'yxatida direktor telefoni (email o'rniga).
-- Faqat platforma administratori ko'radi va o'zgartiradi (0032: is_platform_admin()).

alter table organizations
  add column if not exists paid_until date;

create table if not exists platform_payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  amount numeric not null check (amount > 0),
  months integer not null default 1 check (months between 1 and 36),
  method text not null default 'Naqd',
  note text,
  paid_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists platform_payments_org_idx on platform_payments (org_id, paid_at desc);
alter table platform_payments enable row level security;

drop policy if exists platform_payments_admin on platform_payments;
create policy platform_payments_admin on platform_payments for all
  using (coalesce(public.is_platform_admin(), false))
  with check (coalesce(public.is_platform_admin(), false));

-- Markazlar ro'yxati: email o'rniga direktor telefoni va obuna sanasi.
drop function if exists public.admin_organizations();

create or replace function public.admin_organizations()
returns table (
  id uuid, name text, type text, plan text,
  trial_ends_at timestamptz, created_at timestamptz,
  phone text, students bigint, members bigint, slug text,
  paid_until date
)
language plpgsql stable security definer set search_path = public as $fn$
begin
  if not public.is_platform_admin() then
    raise exception 'Ruxsat yo''q';
  end if;
  return query
  select o.id, o.name, o.type::text, o.plan, o.trial_ends_at, o.created_at,
    o.phone::text,
    (select count(*) from public.students s where s.org_id = o.id and s.status = 'active'),
    (select count(*) from public.org_members m where m.org_id = o.id),
    o.slug,
    o.paid_until
  from public.organizations o
  order by o.created_at desc;
end;
$fn$;

revoke execute on function public.admin_organizations() from public, anon;
grant execute on function public.admin_organizations() to authenticated;

-- To'lovni yozadi va obunani shu davrga uzaytiradi (muddat o'tgan bo'lsa bugundan boshlab).
create or replace function public.admin_record_payment(
  p_org uuid, p_amount numeric, p_months integer, p_method text, p_note text, p_paid_at date
)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  if not public.is_platform_admin() then
    raise exception 'Ruxsat yo''q';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Summa noto''g''ri';
  end if;
  if p_months is null or p_months < 1 or p_months > 36 then
    raise exception 'Oylar soni noto''g''ri';
  end if;

  insert into public.platform_payments (org_id, amount, months, method, note, paid_at)
  values (p_org, p_amount, p_months, coalesce(nullif(p_method, ''), 'Naqd'), nullif(p_note, ''), coalesce(p_paid_at, current_date));

  update public.organizations
  set plan = 'active',
      paid_until = (greatest(current_date, coalesce(paid_until, current_date)) + (p_months || ' months')::interval)::date
  where id = p_org;
end;
$fn$;

revoke execute on function public.admin_record_payment(uuid, numeric, integer, text, text, date) from public, anon;
grant execute on function public.admin_record_payment(uuid, numeric, integer, text, text, date) to authenticated;


-- ================= 0065_trial_7_days_payment_30.sql =================
-- 0065_trial_7_days_payment_30.sql
-- Obuna qoidalari: yangi markazga 7 kunlik sinov; har bir to'lov "oy" = 30 kun.
-- To'lov sinov davri tugagach ishga tushadi (sinov kunlari yo'qolmaydi): obuna
-- max(bugun, joriy tugash sanasi) dan boshlab 30 kun * oylar soniga uzayadi.

-- Bazadagi standart sinov muddati: 7 kun (eskisi 14 edi). Kodda ham 7 kun aniq beriladi.
alter table organizations
  alter column trial_ends_at set default (now() + interval '7 days');

create or replace function public.admin_record_payment(
  p_org uuid, p_amount numeric, p_months integer, p_method text, p_note text, p_paid_at date
)
returns void language plpgsql security definer set search_path = public as $fn$
declare
  v_base date;
begin
  if not public.is_platform_admin() then
    raise exception 'Ruxsat yo''q';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Summa noto''g''ri';
  end if;
  if p_months is null or p_months < 1 or p_months > 36 then
    raise exception 'Oylar soni noto''g''ri';
  end if;

  insert into public.platform_payments (org_id, amount, months, method, note, paid_at)
  values (p_org, p_amount, p_months, coalesce(nullif(p_method, ''), 'Naqd'), nullif(p_note, ''), coalesce(p_paid_at, current_date));

  -- Hisoblash boshi: hali tugamagan sinov yoki obuna bo'lsa shu sanadan, aks holda bugundan.
  select greatest(
           current_date,
           coalesce(o.paid_until, current_date),
           case when o.plan = 'trial' and o.trial_ends_at is not null then o.trial_ends_at::date else current_date end
         )
    into v_base
    from public.organizations o
   where o.id = p_org;

  update public.organizations
     set plan = 'active',
         paid_until = v_base + (p_months * 30)
   where id = p_org;
end;
$fn$;

revoke execute on function public.admin_record_payment(uuid, numeric, integer, text, text, date) from public, anon;
grant execute on function public.admin_record_payment(uuid, numeric, integer, text, text, date) to authenticated;


-- ================= 0066_work_schedule_calendar.sql =================
-- 0066_work_schedule_calendar.sql
-- Edu tizimdagi "Ish jadvali": yil, kod va har kun uchun ish vaqti yoki dam olish (yillik kalendar).
-- days: { "2026-09-05": "off", "2026-09-07": { "s": "09:00", "e": "18:00", "a": "08:50", "bs": "13:00", "be": "14:00" } }
-- Eski oddiy jadvallar (boshlanish/tugash vaqti) o'zgarishsiz qoladi.

alter table work_schedules
  alter column start_time drop not null,
  alter column end_time drop not null,
  add column if not exists year integer,
  add column if not exists code text,
  add column if not exists days jsonb not null default '{}'::jsonb;


-- ================= 0067_demo_requests.sql =================
-- 0067_demo_requests.sql
-- Rasmiy saytdagi "Demo uchun ariza": mijoz nomini, telefonini qoldiradi; arizalar super adminda ko'rinadi.
-- Jadvalga brauzerdan yozib/o'qib bo'lmaydi (RLS: faqat platforma administratori). Ariza server amali orqali
-- (service role) yoziladi va u spamdan himoyalangan.

create table if not exists demo_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  center_name text not null,
  contact_name text not null,
  phone text not null,
  comment text,
  status text not null default 'new' check (status in ('new', 'contacted', 'opened', 'rejected')),
  note text
);

create index if not exists demo_requests_created_idx on demo_requests (created_at desc);
alter table demo_requests enable row level security;

drop policy if exists demo_requests_admin on demo_requests;
create policy demo_requests_admin on demo_requests for all
  using (coalesce(public.is_platform_admin(), false))
  with check (coalesce(public.is_platform_admin(), false));


-- ================= 0068_finance_year_flows.sql =================
-- 0068_finance_year_flows.sql
-- Edu tizimdagi "Moliya hisobotlari (P&L)" va "Pul oqimi": oylar bo'yicha kirim-chiqim va yil boshidagi balans.
-- Funksiya security invoker: RLS ishlaydi, har markaz faqat o'z ma'lumotini ko'radi.
-- Tranzaksiya turiga "faoliyat turi" qo'shiladi (Operatsion / Investitsion / Moliyaviy) — pul oqimi hisobotida guruhlash uchun.

-- Bo'sh (null) qiymat hisobotda "Operatsion" hisoblanadi.
alter table transaction_types
  add column if not exists activity text
    check (activity is null or activity in ('Operatsion', 'Investitsion', 'Moliyaviy'));

-- Qaytadi: (kind, category, month, total). kind: income | expense | salary | opening (month = 0).
create or replace function public.finance_year_flows(p_year integer)
returns table (kind text, category text, month integer, total numeric)
language sql
stable
security invoker
set search_path = public
as $fn$
  select 'income'::text, coalesce(p.method, 'boshqa')::text, extract(month from p.paid_at)::integer, sum(p.amount)
    from payments p
   where extract(year from p.paid_at) = p_year
   group by 2, 3
  union all
  select 'expense'::text, coalesce(e.category, 'Boshqa')::text, extract(month from e.spent_at)::integer, sum(e.amount)
    from expenses e
   where extract(year from e.spent_at) = p_year
   group by 2, 3
  union all
  select 'salary'::text, 'Oylik'::text, extract(month from s.paid_at)::integer, sum(s.amount)
    from salary_payouts s
   where extract(year from s.paid_at) = p_year
   group by 3
  union all
  select 'opening'::text, ''::text, 0,
         coalesce((select sum(amount) from payments where paid_at < make_date(p_year, 1, 1)), 0)
         - coalesce((select sum(amount) from expenses where spent_at < make_date(p_year, 1, 1)), 0)
         - coalesce((select sum(amount) from salary_payouts where paid_at < make_date(p_year, 1, 1)), 0);
$fn$;

grant execute on function public.finance_year_flows(integer) to authenticated;


-- ================= 0069_harden_public_functions.sql =================
-- 0069_harden_public_functions.sql
-- Xavfsizlik: Postgres funksiyalarga standart holatda hammaga (hatto kirmagan foydalanuvchiga ham) ruxsat beradi,
-- Supabase esa ularni /rest/v1/rpc/... orqali ochadi. Quyidagilar boshqa markaz ma'lumotini oshkor qilardi:
--   * default_cashbox(p_org)  — istalgan markazning kassa id'sini qaytaradi (yo'q bo'lsa yangi kassa yozadi);
--   * org_is_active(p_org)    — istalgan markaz faolmi-yo'qmi, kirmagan foydalanuvchiga ham ko'rinardi;
--   * get_invite / accept_invite — taklif oqimi olib tashlangan, endi kerak emas.
-- default_cashbox faqat bazadagi trigger ichida (funksiya egasi huquqi bilan) chaqiriladi, tashqaridan kerak emas.

revoke execute on function public.default_cashbox(uuid) from public, anon, authenticated;

-- RLS siyosatlari ichida is_org_member orqali chaqiriladi (u ham security definer), shuning uchun tizimga
-- kirganlarda qoladi, kirmaganlardan olinadi.
revoke execute on function public.org_is_active(uuid) from public, anon;
grant execute on function public.org_is_active(uuid) to authenticated;

revoke execute on function public.get_invite(uuid) from public, anon, authenticated;
revoke execute on function public.accept_invite(uuid) from public, anon, authenticated;


-- ================= 0070_attendance_reason.sql =================
-- 0070_attendance_reason.sql
-- Edu tizimdagi davomat oynasi: kelmagan o'quvchi uchun "Sababi" (kasal, oilaviy sabab va h.k.).
-- Ustun ixtiyoriy; eski davomat yozuvlariga ta'sir qilmaydi.

alter table attendance add column if not exists reason text;


-- ================= 0071_site_news.sql =================
-- 0071_site_news.sql
-- Rasmiy saytdagi "Yangiliklar": super admin panelda yoziladi, saytda oxirgi e'lon qilinganlari ko'rinadi.
-- Jadval RLS bilan yopiq: faqat platforma administratori o'zgartiradi; sayt uni server tomonda (service role) o'qiydi.

create table if not exists site_news (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  body text,
  is_published boolean not null default true
);

create index if not exists site_news_created_idx on site_news (created_at desc);
alter table site_news enable row level security;

drop policy if exists site_news_admin on site_news;
create policy site_news_admin on site_news for all
  using (coalesce(public.is_platform_admin(), false))
  with check (coalesce(public.is_platform_admin(), false));

-- ================= 0072_staff_edu_columns.sql =================

alter table teachers
  add column if not exists branch_ids uuid[] not null default '{}',
  add column if not exists left_on date,
  add column if not exists leave_reason text;
