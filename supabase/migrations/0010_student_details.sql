-- 0010_student_details.sql
-- O'quvchi/bola bazasini rasmiy hujjat darajasiga kengaytirish.
--
-- Shartnoma rasmiy hujjat bo'lgani uchun to'liq ma'lumot kerak:
-- FISH alohida maydonlarda, tug'ilganlik guvohnomasi, pasport/JSHSHIR,
-- ota-ona (vasiy) ma'lumotlari va yashash manzili.
--
-- Mavjud full_name saqlanadi va avtomatik to'ldiriladi (trigger orqali),
-- shunda eski ro'yxatlar va Telegram xabarlari ishlashda davom etadi.

alter table students
  -- Shaxsiy
  add column last_name text,
  add column first_name text,
  add column middle_name text,
  add column birth_date date,
  add column gender text check (gender in ('erkak','ayol')),
  add column nationality text,

  -- Tug'ilganlik haqida guvohnoma
  add column birth_cert_series text,
  add column birth_cert_number text,

  -- Pasport (katta yoshdagilar uchun)
  add column passport_number text,
  add column passport_pinfl text,
  add column passport_issued_date date,

  -- Ota-ona yoki vasiy
  add column parent_full_name text,
  add column parent_relation text,
  add column parent_passport_number text,
  add column parent_pinfl text,
  add column parent_passport_issued_date date,
  add column parent_passport_issued_by text,
  add column parent_phone text,

  -- Yashash manzili
  add column region text,
  add column district text,
  add column address text;

-- full_name'ni FISH maydonlaridan avtomatik yig'ish.
-- Eski yozuvlar va faqat full_name kiritilgan holatlar buzilmaydi.
create or replace function public.sync_student_full_name()
returns trigger
language plpgsql
as $$
begin
  if new.last_name is not null or new.first_name is not null then
    new.full_name := trim(
      coalesce(new.last_name, '') || ' ' ||
      coalesce(new.first_name, '') || ' ' ||
      coalesce(new.middle_name, '')
    );
  end if;
  return new;
end;
$$;

create trigger trg_sync_student_full_name
before insert or update on students
for each row
execute function sync_student_full_name();
