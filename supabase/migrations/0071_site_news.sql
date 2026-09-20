-- 0071_site_news.sql
-- Rasmiy saytdagi "Yangiliklar": super admin panelda yoziladi, saytda oxirgi e'lon qilinganlari ko'rinadi.
-- Jadval RLS bilan yopiq: faqat platforma administratori o'zgartiradi; sayt uni server tomonda (service role) o'qiydi.

create table if not exists site_news (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  body text,
  is_published boolean not null default true
);

create index if not exists site_news_created_idx on site_news (created_at desc);
alter table site_news enable row level security;

drop policy if exists site_news_admin on site_news;
create policy site_news_admin on site_news for all
  using (coalesce(public.is_platform_admin(), false))
  with check (coalesce(public.is_platform_admin(), false));
