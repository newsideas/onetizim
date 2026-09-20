-- 2-QADAM: 1-qadam tugagandan KEYIN yangi so'rov ochib, shu faylni to'liq joylab, Run bosing.
-- (0040 + 0041 + 0042 + 0043).

-- ================= 0040_login_accounts.sql =================
-- 0040_login_accounts.sql
-- Login/parol bilan kirish: a'zoning login'i (telefon yoki direktor bergan login)
-- saqlanadi. Buxgalter roli uchun moliya bo'yicha qo'shimcha RLS.
-- (0039 dan keyin ishga tushiring.)

alter table org_members add column if not exists login text;

create unique index if not exists org_members_login_key
  on org_members (org_id, lower(login)) where login is not null;

create or replace function public.is_org_accountant(p_org uuid)
returns boolean language sql stable security definer set search_path = public as $fn$
  select public.org_is_active(p_org) and exists (
    select 1 from public.org_members
    where org_id = p_org and user_id = auth.uid() and role = 'accountant'
  );
$fn$;

-- Buxgalter: o'quvchi va sinflarni faqat o'qiydi.
drop policy if exists students_accountant_select on students;
create policy students_accountant_select on students
  for select using (is_org_accountant(org_id));

drop policy if exists groups_accountant_select on groups;
create policy groups_accountant_select on groups
  for select using (is_org_accountant(org_id));

-- Buxgalter: to'lov, hisob va xarajatlar bilan to'liq ishlaydi.
do $$
declare
  t text;
begin
  foreach t in array array['payments', 'charges'] loop
    execute format('drop policy if exists %I on %I', t || '_accountant', t);
    execute format(
      'create policy %I on %I for all using (exists (select 1 from students s where s.id = student_id and is_org_accountant(s.org_id))) with check (exists (select 1 from students s where s.id = student_id and is_org_accountant(s.org_id)))',
      t || '_accountant', t
    );
  end loop;

  foreach t in array array['expenses', 'contracts'] loop
    execute format('drop policy if exists %I on %I', t || '_accountant', t);
    execute format(
      'create policy %I on %I for all using (is_org_accountant(org_id)) with check (is_org_accountant(org_id))',
      t || '_accountant', t
    );
  end loop;

  foreach t in array array[
    'contract_types', 'contract_discounts', 'bank_accounts', 'contract_amounts'
  ] loop
    execute format('drop policy if exists %I on %I', t || '_accountant', t);
    execute format(
      'create policy %I on %I for select using (is_org_accountant(org_id))',
      t || '_accountant', t
    );
  end loop;
end $$;

-- ================= 0041_student_archived_at.sql =================
-- 0041_student_archived_at.sql
-- Bosh sahifadagi "Yangi o'quvchidan ketganlar" va "Aktiv o'quvchidan
-- ketganlar" kartalari uchun: o'quvchi qachon arxivlangani saqlanadi.
--
-- Nega trigger: status turli joylardan o'zgaradi (forma, import, ommaviy
-- amal) — sana har birida qo'lda yozilsa, biror joyda unutiladi.
-- Mavjud arxivlanganlarning aniq sanasi noma'lum, shuning uchun ular
-- yaratilgan sanasiga tenglashtiriladi.

alter table students add column if not exists archived_at timestamptz;

update students
set archived_at = coalesce(created_at, now())
where status = 'archived' and archived_at is null;

create or replace function set_student_archived_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'archived' and (tg_op = 'INSERT' or old.status is distinct from 'archived') then
    new.archived_at := now();
  elsif new.status <> 'archived' then
    new.archived_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists students_archived_at on students;
create trigger students_archived_at
  before insert or update of status on students
  for each row execute function set_student_archived_at();

-- ================= 0042_group_module.sql =================
-- 0042_group_module.sql
-- Edu tizimdagi "Guruh" bo'limi uchun: guruh holati/darajasi/Telegram havolasi,
-- xonaga sig'im va mas'ul shaxs, jihozlar va ularning xonalarga biriktirilishi,
-- vazifaga maksimal ball.

-- 1) Guruh
alter table groups
  add column if not exists status text not null default 'active',
  add column if not exists level text,
  add column if not exists telegram_url text;

do $$ begin
  alter table groups add constraint groups_status_check
    check (status in ('active', 'waiting', 'archived'));
exception when duplicate_object then null;
end $$;

-- 2) Xona: sig'im, izoh, mas'ul xodim (teachers = barcha xodimlar)
alter table rooms
  add column if not exists capacity integer check (capacity is null or capacity >= 0),
  add column if not exists note text,
  add column if not exists responsible_id uuid references teachers(id) on delete set null;

-- 3) Jihozlar
create sequence if not exists equipment_code_seq;

create table if not exists equipment (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  -- Bo'sh qoldirilsa avtomatik yaratiladi (INV-00001).
  inventory_code text not null
    default ('INV-' || lpad(nextval('equipment_code_seq')::text, 5, '0')),
  unit_price numeric not null default 0 check (unit_price >= 0),
  created_at timestamptz not null default now(),
  unique (org_id, inventory_code)
);

create table if not exists room_equipment (
  org_id uuid not null references organizations(id) on delete cascade,
  room_id uuid not null references rooms(id) on delete cascade,
  equipment_id uuid not null references equipment(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  primary key (room_id, equipment_id)
);

create index if not exists room_equipment_equipment_idx on room_equipment (equipment_id);

alter table equipment enable row level security;
alter table room_equipment enable row level security;

drop policy if exists equipment_read on equipment;
create policy equipment_read on equipment
  for select using (is_org_member(org_id));

drop policy if exists equipment_manage on equipment;
create policy equipment_manage on equipment
  for all using (can_manage_org(org_id))
  with check (can_manage_org(org_id));

drop policy if exists room_equipment_read on room_equipment;
create policy room_equipment_read on room_equipment
  for select using (is_org_member(org_id));

drop policy if exists room_equipment_manage on room_equipment;
create policy room_equipment_manage on room_equipment
  for all using (can_manage_org(org_id))
  with check (
    can_manage_org(org_id)
    and exists (select 1 from rooms r where r.id = room_id and r.org_id = room_equipment.org_id)
    and exists (select 1 from equipment e where e.id = equipment_id and e.org_id = room_equipment.org_id)
  );

-- 4) Vazifa: maksimal ball
alter table homework
  add column if not exists max_score integer check (max_score is null or max_score > 0);

-- ================= 0043_centers_only.sql =================
-- 0043_centers_only.sql
-- Tizim faqat o'quv markazlarga xizmat qiladi va markazni faqat super admin ochadi.
--
-- 1) Muassasa turi faqat 'markaz'. Cheklov avval olib tashlanadi, aks holda eski
--    cheklov ('togarak'/'maktab') yangilanayotgan qatorlarni rad etardi.
--    DIQQAT: mavjud 'maktab' / 'bogcha' / 'togarak' muassasalari 'markaz' ga o'tkaziladi.
-- 2) Har bir kirgan foydalanuvchi o'z muassasasini yarata olishi (0002) yopiladi:
--    yangi markazni faqat super admin ochadi (service role RLS'dan o'tadi).

alter table organizations drop constraint if exists organizations_type_check;

update organizations set type = 'markaz' where type <> 'markaz';

alter table organizations
  add constraint organizations_type_check check (type = 'markaz');

alter table organizations alter column type set default 'markaz';

drop policy if exists "organizations_insert_own" on organizations;

