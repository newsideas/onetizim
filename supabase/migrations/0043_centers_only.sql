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
