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
