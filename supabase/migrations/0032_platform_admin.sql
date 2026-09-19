-- 0032_platform_admin.sql
-- Platforma (Super Admin) paneli: barcha maktablarni ko'rish va obunani boshqarish.
-- platform_admins jadvaliga brauzerdan kirib bo'lmaydi (siyosat yo'q);
-- hammasi security definer funksiyalar orqali va har birida tekshiruv bor.

create table if not exists platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table platform_admins enable row level security;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$fn$;

create or replace function public.admin_organizations()
returns table (
  id uuid, name text, type text, plan text,
  trial_ends_at timestamptz, created_at timestamptz,
  owner_email text, students bigint, members bigint
)
language plpgsql stable security definer set search_path = public as $fn$
begin
  if not public.is_platform_admin() then
    raise exception 'Ruxsat yo''q';
  end if;
  return query
  select o.id, o.name, o.type::text, o.plan, o.trial_ends_at, o.created_at,
    (select u.email::text from auth.users u where u.id = o.owner_id),
    (select count(*) from public.students s where s.org_id = o.id and s.status = 'active'),
    (select count(*) from public.org_members m where m.org_id = o.id)
  from public.organizations o
  order by o.created_at desc;
end;
$fn$;

create or replace function public.admin_set_plan(
  p_org uuid, p_plan text, p_trial_ends timestamptz
)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  if not public.is_platform_admin() then
    raise exception 'Ruxsat yo''q';
  end if;
  if p_plan not in ('trial', 'active', 'expired') then
    raise exception 'Noto''g''ri reja';
  end if;
  update public.organizations
  set plan = p_plan, trial_ends_at = coalesce(p_trial_ends, trial_ends_at)
  where id = p_org;
end;
$fn$;

revoke execute on function public.is_platform_admin() from public, anon;
revoke execute on function public.admin_organizations() from public, anon;
revoke execute on function public.admin_set_plan(uuid, text, timestamptz) from public, anon;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.admin_organizations() to authenticated;
grant execute on function public.admin_set_plan(uuid, text, timestamptz) to authenticated;
