-- 0065_trial_7_days_payment_30.sql
-- Obuna qoidalari: yangi markazga 7 kunlik sinov; har bir to'lov "oy" = 30 kun.
-- To'lov sinov davri tugagach ishga tushadi (sinov kunlari yo'qolmaydi): obuna
-- max(bugun, joriy tugash sanasi) dan boshlab 30 kun * oylar soniga uzayadi.

-- Bazadagi standart sinov muddati: 7 kun (eskisi 14 edi). Kodda ham 7 kun aniq beriladi.
alter table organizations
  alter column trial_ends_at set default (now() + interval '7 days');

create or replace function public.admin_record_payment(
  p_org uuid, p_amount numeric, p_months integer, p_method text, p_note text, p_paid_at date
)
returns void language plpgsql security definer set search_path = public as $fn$
declare
  v_base date;
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

  -- Hisoblash boshi: hali tugamagan sinov yoki obuna bo'lsa shu sanadan, aks holda bugundan.
  select greatest(
           current_date,
           coalesce(o.paid_until, current_date),
           case when o.plan = 'trial' and o.trial_ends_at is not null then o.trial_ends_at::date else current_date end
         )
    into v_base
    from public.organizations o
   where o.id = p_org;

  update public.organizations
     set plan = 'active',
         paid_until = v_base + (p_months * 30)
   where id = p_org;
end;
$fn$;

revoke execute on function public.admin_record_payment(uuid, numeric, integer, text, text, date) from public, anon;
grant execute on function public.admin_record_payment(uuid, numeric, integer, text, text, date) to authenticated;
