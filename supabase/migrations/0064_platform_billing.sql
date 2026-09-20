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
