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
