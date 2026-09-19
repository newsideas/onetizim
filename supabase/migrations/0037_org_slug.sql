-- 0037_org_slug.sql
-- Har maktabga subdomen (slug): renessans.edugram.uz. Ro'yxatdan o'tishda
-- tanlanadi; keyin faqat platforma administratori o'zgartira oladi.

alter table organizations add column if not exists slug text;

create or replace function public.slug_is_valid(p text)
returns boolean language sql immutable as $fn$
  select p ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$'
    and p !~ '--'
    and p not in (
      'www', 'admin', 'app', 'api', 'mail', 'ftp', 'static', 'cdn', 'dev', 'test',
      'staging', 'demo', 'edugram', 'support', 'help', 'status', 'blog', 'docs',
      'login', 'register', 'root', 'site', 'platform', 'superadmin'
    );
$fn$;

-- Mavjud maktablarga subdomen berish (faqat hali berilmaganlarga).
update organizations set slug = case
  when name = 'CLAUDE CODE' then 'claude-code'
  when name ilike 'renesans%' then 'renessans'
  when name ilike 'iqbol%' then 'iqbol'
  else 'org-' || substr(id::text, 1, 8)
end
where slug is null;

alter table organizations drop constraint if exists organizations_slug_valid;
alter table organizations add constraint organizations_slug_valid
  check (slug is null or public.slug_is_valid(slug));

create unique index if not exists organizations_slug_key
  on organizations (slug) where slug is not null;

create or replace function public.guard_org_slug()
returns trigger language plpgsql as $fn$
begin
  if old.slug is not null
     and new.slug is distinct from old.slug
     and not coalesce(public.is_platform_admin(), false)
     and coalesce(auth.uid()::text, '') <> '' then
    raise exception 'Maktab manzilini faqat platforma administratori o''zgartiradi';
  end if;
  return new;
end;
$fn$;

drop trigger if exists trg_guard_org_slug on organizations;
create trigger trg_guard_org_slug
before update on organizations
for each row execute function public.guard_org_slug();

-- Kirishdan oldin ochiq: login sahifasi maktab nomini ko'rsatadi.
create or replace function public.org_public_by_slug(p_slug text)
returns table (name text, type text)
language sql stable security definer set search_path = public as $fn$
  select o.name, o.type::text from public.organizations o
  where o.slug = lower(p_slug) limit 1;
$fn$;

create or replace function public.slug_available(p_slug text)
returns boolean
language sql stable security definer set search_path = public as $fn$
  select public.slug_is_valid(lower(p_slug))
    and not exists (select 1 from public.organizations where slug = lower(p_slug));
$fn$;

grant execute on function public.org_public_by_slug(text) to anon, authenticated;
grant execute on function public.slug_available(text) to anon, authenticated;
