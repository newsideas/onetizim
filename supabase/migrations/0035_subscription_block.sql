-- 0035_subscription_block.sql
-- Obunasi tugagan maktab bloklanadi: barcha RLS funksiyalari shu maktab
-- uchun "false" qaytaradi, ya'ni ma'lumotni o'qib ham, yozib ham bo'lmaydi.
-- Faqat foydalanuvchi o'z a'zoligini va tashkilot qatorini o'qiy oladi
-- (ilova "Obuna tugagan" sahifasini ko'rsatishi uchun).

create or replace function public.org_is_active(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select coalesce((
    select case o.plan
      when 'active' then true
      when 'expired' then false
      else (o.trial_ends_at is null or o.trial_ends_at >= now())
    end
    from public.organizations o
    where o.id = p_org
  ), false);
$fn$;

-- Obuna holatidan qat'i nazar a'zolik (faqat identifikatsiya uchun).
create or replace function public.is_org_member_any(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.org_members where org_id = p_org and user_id = auth.uid()
  );
$fn$;

create or replace function public.is_org_member(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select public.org_is_active(p_org) and exists (
    select 1 from public.org_members where org_id = p_org and user_id = auth.uid()
  );
$fn$;

create or replace function public.can_manage_org(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select public.org_is_active(p_org) and exists (
    select 1 from public.org_members
    where org_id = p_org and user_id = auth.uid() and role in ('owner', 'manager')
  );
$fn$;

create or replace function public.is_org_director(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select public.org_is_active(p_org) and exists (
    select 1 from public.org_members
    where org_id = p_org and user_id = auth.uid() and role = 'owner'
  );
$fn$;

create or replace function public.is_org_owner(check_org_id uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select public.org_is_active(check_org_id) and exists (
    select 1 from public.organizations
    where id = check_org_id and owner_id = auth.uid()
  );
$fn$;

drop policy if exists org_members_select on public.org_members;
create policy org_members_select on public.org_members
  for select using (user_id = auth.uid() or public.is_org_member(org_id));

drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member on public.organizations
  for select using (owner_id = auth.uid() or public.is_org_member_any(id));
