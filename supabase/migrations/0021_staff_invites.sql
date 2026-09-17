-- 0021_staff_invites.sql
-- Xodimni tizimga taklif qilish. Direktor havola yaratadi, xodim o'z
-- email/paroli bilan ro'yxatdan o'tib havolani qabul qiladi.
-- Service role kaliti kerak emas: qabul qilish security definer funksiya.

create table if not exists org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  role org_role not null check (role <> 'owner'),
  employee_id uuid references teachers(id) on delete set null,
  full_name text,
  created_by uuid references auth.users(id) default auth.uid(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table org_invites enable row level security;
drop policy if exists org_invites_director on org_invites;
create policy org_invites_director on org_invites
  for all using (is_org_director(org_id)) with check (is_org_director(org_id));

-- Taklif sahifasi kirishdan oldin ham ochiladi: faqat xavfsiz maydonlar.
create or replace function public.get_invite(p_token uuid)
returns table (org_name text, role org_role, full_name text, status text)
language sql stable security definer set search_path = public as $fn$
  select o.name, i.role, i.full_name,
    case
      when i.accepted_at is not null then 'accepted'
      when i.expires_at < now() then 'expired'
      else 'pending'
    end
  from org_invites i
  join organizations o on o.id = i.org_id
  where i.token = p_token;
$fn$;

create or replace function public.accept_invite(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_invite org_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_invite from org_invites where token = p_token for update;

  if not found then raise exception 'INVITE_NOT_FOUND'; end if;
  if v_invite.accepted_at is not null then raise exception 'INVITE_USED'; end if;
  if v_invite.expires_at < now() then raise exception 'INVITE_EXPIRED'; end if;
  if exists (select 1 from org_members where user_id = auth.uid()) then
    raise exception 'ALREADY_MEMBER';
  end if;

  insert into org_members (org_id, user_id, role, employee_id, full_name, email)
  values (
    v_invite.org_id, auth.uid(), v_invite.role, v_invite.employee_id,
    v_invite.full_name, auth.jwt() ->> 'email'
  );

  update org_invites
  set accepted_at = now(), accepted_by = auth.uid()
  where id = v_invite.id;

  return v_invite.org_id;
end;
$fn$;

grant execute on function public.get_invite(uuid) to anon, authenticated;
revoke execute on function public.accept_invite(uuid) from anon, public;
grant execute on function public.accept_invite(uuid) to authenticated;
