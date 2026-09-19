-- 0038_admin_orgs_slug.sql
-- Super Admin ro'yxatida maktab subdomeni ham chiqsin (0037 dan keyin).

drop function if exists public.admin_organizations();

create or replace function public.admin_organizations()
returns table (
  id uuid, name text, type text, plan text,
  trial_ends_at timestamptz, created_at timestamptz,
  owner_email text, students bigint, members bigint, slug text
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
    (select count(*) from public.org_members m where m.org_id = o.id),
    o.slug
  from public.organizations o
  order by o.created_at desc;
end;
$fn$;

revoke execute on function public.admin_organizations() from public, anon;
grant execute on function public.admin_organizations() to authenticated;
