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
