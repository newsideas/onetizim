-- 0022_access_token_hook.sql
-- JWT'ga "org_role" claim qo'shadi — proxy.ts bazaga murojaat qilmasdan
-- bo'limga kirishni oldindan tekshiradi. Bu faqat tezkor yo'naltirish:
-- haqiqiy himoya RLS va serverdagi ruxsat tekshiruvida.
--
-- Qo'llagandan keyin yoqish: Supabase Dashboard -> Authentication ->
-- Hooks -> Customize Access Token (JWT) Claims -> public.custom_access_token_hook
-- Yoqilmasa ham tizim ishlaydi, faqat proxy tekshiruvi o'tkazib yuboriladi.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $fn$
declare
  v_claims jsonb := coalesce(event -> 'claims', '{}'::jsonb);
  v_role text;
begin
  select m.role::text into v_role
  from public.org_members m
  where m.user_id = (event ->> 'user_id')::uuid
  limit 1;

  if v_role is null then
    v_claims := v_claims - 'org_role';
  else
    v_claims := jsonb_set(v_claims, '{org_role}', to_jsonb(v_role));
  end if;

  return jsonb_set(event, '{claims}', v_claims);
end;
$fn$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

grant select on table public.org_members to supabase_auth_admin;
drop policy if exists org_members_auth_admin on public.org_members;
create policy org_members_auth_admin on public.org_members
  as permissive for select to supabase_auth_admin using (true);
