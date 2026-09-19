-- 0031_admission.sql
-- Xususiy maktab qabul voronkasi:
-- Yangi -> Bog'lanildi -> Maktabga tashrif -> Test -> Qabul qilindi
-- -> Shartnoma -> To'lov -> O'quvchi (yoki Rad etildi).
-- Eski bosqichlar ko'chiriladi: trial -> visit, thinking -> contacted.

alter table leads drop constraint if exists leads_stage_check;

update leads set stage = 'visit' where stage = 'trial';
update leads set stage = 'contacted' where stage = 'thinking';

alter table leads add constraint leads_stage_check
  check (stage in (
    'new', 'contacted', 'visit', 'test', 'accepted',
    'contract', 'paid', 'enrolled', 'lost'
  ));

-- full_name endi bolaning F.I.Sh.; ota-ona alohida ustunda.
alter table leads
  add column if not exists parent_name text,
  add column if not exists interest_level text
    check (interest_level in ('cold', 'warm', 'hot')),
  add column if not exists next_contact_on date;

create index if not exists leads_next_contact_idx on leads (org_id, next_contact_on)
  where next_contact_on is not null;
