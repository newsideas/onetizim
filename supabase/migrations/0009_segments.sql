-- 0009_segments.sql
-- Uchta segment: xususiy maktab, bog'cha, o'quv markaz.
--
-- Avval ikkita tur bor edi ('togarak', 'maktab'). Endi:
--   maktab  — xususiy maktab (sinf, chorak, baho jurnali)
--   bogcha  — bog'cha (yosh guruhi, tibbiy ma'lumot, ovqatlanish)
--   markaz  — o'quv markaz / to'garak (kurs guruhi, oylik to'lov)
--
-- 'togarak' -> 'markaz' deb qayta nomlandi, chunki "o'quv markaz" kengroq
-- tushuncha va mijozlar shu atamani ishlatadi.

alter table organizations drop constraint if exists organizations_type_check;

update organizations set type = 'markaz' where type = 'togarak';

alter table organizations add constraint organizations_type_check
  check (type in ('maktab', 'bogcha', 'markaz'));
