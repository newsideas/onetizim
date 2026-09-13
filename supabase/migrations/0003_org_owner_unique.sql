-- 0003_org_owner_unique.sql
-- Test paytida yuzaga kelgan race condition tufayli bitta foydalanuvchi
-- uchun bir nechta organizations yozuvi yaratilib qolishi mumkin edi.
-- Bu migratsiya: (1) mavjud dublikatlarni tozalaydi (eng birinchisini
-- qoldirib), (2) owner_id ustuniga UNIQUE cheklov qo'yadi (bir
-- foydalanuvchi — bitta tashkilot), (3) organizations uchun delete
-- policy qo'shadi.

-- 1) Dublikatlarni tozalash: har bir owner_id uchun eng qadimgisini
-- qoldirib, qolganlarini o'chirish.
delete from organizations a
using organizations b
where a.owner_id = b.owner_id
  and a.owner_id is not null
  and a.created_at > b.created_at;

-- 2) Bir foydalanuvchi — bitta tashkilot.
alter table organizations
  add constraint organizations_owner_id_key unique (owner_id);

-- 3) O'chirish uchun policy (avval yo'q edi).
create policy "organizations_delete_own" on organizations
  for delete using (owner_id = auth.uid());
