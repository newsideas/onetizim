-- 0011_org_details.sql
-- Muassasa va rahbar ma'lumotlari — ro'yxatdan o'tishda to'ldiriladi.
--
-- Shartnoma, hisobot va rasmiy hujjatlar uchun muassasaning rasmiy
-- rekvizitlari kerak (STIR, manzil), rahbar esa tizimning mas'ul shaxsi.

alter table organizations
  add column tin text,                    -- STIR (soliq to'lovchi raqami)
  add column region text,
  add column district text,
  add column address text,
  add column director_last_name text,
  add column director_first_name text,
  add column phone text;
