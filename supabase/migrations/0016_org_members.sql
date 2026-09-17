-- 0016_org_members.sql
-- Rollar: bitta tashkilotda bir nechta foydalanuvchi (direktor, menejer,
-- o'qituvchi). Avval tizimda faqat tashkilot egasi (owner_id) bor edi.

do $$ begin
  create type org_role as enum ('owner', 'manager', 'teacher');
exception when duplicate_object then null;
end $$;

-- teachers jadvali endi barcha xodimlar ro'yxati (o'qituvchi, menejer,
-- ma'muriyat). Nomi guruhlardagi teacher_id bilan bog'liqligi uchun
-- o'zgartirilmadi.
alter table teachers
  add column if not exists position text,
  add column if not exists kind text not null default 'teacher',
  add column if not exists is_active boolean not null default true;

do $$ begin
  alter table teachers add constraint teachers_kind_check
    check (kind in ('teacher', 'manager', 'admin'));
exception when duplicate_object then null;
end $$;

create table if not exists org_members (
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role org_role not null,
  employee_id uuid references teachers(id) on delete set null,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- Ilova bitta foydalanuvchi = bitta tashkilot modelida ishlaydi.
create unique index if not exists org_members_user_key on org_members (user_id);
create index if not exists org_members_employee_idx on org_members (employee_id);

-- Mavjud egalarni a'zo sifatida ko'chirish.
insert into org_members (org_id, user_id, role, email)
select o.id, o.owner_id, 'owner', u.email
from organizations o
join auth.users u on u.id = o.owner_id
on conflict do nothing;

-- Yangi tashkilot yaratilganda egasi avtomatik a'zo bo'ladi.
create or replace function public.add_org_owner_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.owner_id is not null then
    insert into org_members (org_id, user_id, role, email)
    select new.id, new.owner_id, 'owner', u.email
    from auth.users u where u.id = new.owner_id
    on conflict do nothing;
  end if;
  return new;
end;
$fn$;

drop trigger if exists trg_add_org_owner_member on organizations;
create trigger trg_add_org_owner_member
after insert on organizations
for each row execute function add_org_owner_member();
