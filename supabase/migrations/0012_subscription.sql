-- Obuna / sinov muddati.
--
-- Har bir tashkilot ro'yxatdan o'tganda 14 kunlik bepul sinov oladi.
-- Header'dagi "Obuna tugashiga N kun qoldi" belgisi shu ustundan
-- hisoblanadi, ya'ni ko'rsatkich haqiqiy ma'lumotga tayanadi.

alter table organizations
  add column if not exists plan text not null default 'trial',
  add column if not exists trial_ends_at timestamptz;

do $$
begin
  alter table organizations
    add constraint organizations_plan_check
    check (plan in ('trial', 'active', 'expired'));
exception
  when duplicate_object then null;
end $$;

-- Mavjud tashkilotlar uchun sinov muddatini ochilgan kunidan hisoblaymiz.
update organizations
set trial_ends_at = created_at + interval '14 days'
where trial_ends_at is null;

alter table organizations
  alter column trial_ends_at set default (now() + interval '14 days');
