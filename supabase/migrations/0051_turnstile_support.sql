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
