-- 0033_plan_guard.sql
-- Direktor o'z tashkilotining obuna maydonlarini (plan, trial_ends_at)
-- o'zgartira olmaydi — faqat platforma administratori (admin_set_plan).
-- Aks holda direktor sinov muddatini o'zi cheksiz uzaytirib olardi.

create or replace function public.guard_org_subscription()
returns trigger language plpgsql as $fn$
begin
  if (new.plan is distinct from old.plan
      or new.trial_ends_at is distinct from old.trial_ends_at)
     and not coalesce(public.is_platform_admin(), false)
     and coalesce(auth.uid()::text, '') <> '' then
    raise exception 'Obuna maydonlarini faqat platforma administratori o''zgartiradi';
  end if;
  return new;
end;
$fn$;

drop trigger if exists trg_guard_org_subscription on public.organizations;
create trigger trg_guard_org_subscription
before update on public.organizations
for each row execute function public.guard_org_subscription();
