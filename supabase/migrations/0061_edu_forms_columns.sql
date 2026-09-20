-- 0061_edu_forms_columns.sql
-- Edu tizimdagi oynalar maydonlari: Filial, Marketing so'rovnomasi, Yangilik, Blok test.
-- Hammasi ixtiyoriy (nullable yoki default bilan); eski yozuvlarga ta'sir qilmaydi.

-- Filiallar: radius, koordinatalar, sig'im va IELTS havolasi.
alter table branches
  add column if not exists radius numeric,
  add column if not exists lat numeric,
  add column if not exists lng numeric,
  add column if not exists max_groups integer,
  add column if not exists max_students integer,
  add column if not exists ielts_link text;

-- Marketing so'rovnomasi: sarlavha (name), subtitr, miqdor, til, ko'rsatish va filial.
alter table marketing_campaigns
  add column if not exists subtitle text,
  add column if not exists amount numeric,
  add column if not exists language text,
  add column if not exists is_shown boolean not null default true,
  add column if not exists branch_id uuid references branches(id) on delete set null;

-- Yangiliklar: kimlar uchun.
alter table news_posts
  add column if not exists for_students boolean not null default true,
  add column if not exists for_parents boolean not null default false,
  add column if not exists for_employees boolean not null default false;

-- Blok test: guruh va mas'ul xodim.
alter table block_tests
  add column if not exists group_id uuid references groups(id) on delete set null,
  add column if not exists responsible_id uuid references teachers(id) on delete set null;
