-- 0067_demo_requests.sql
-- Rasmiy saytdagi "Demo uchun ariza": mijoz nomini, telefonini qoldiradi; arizalar super adminda ko'rinadi.
-- Jadvalga brauzerdan yozib/o'qib bo'lmaydi (RLS: faqat platforma administratori). Ariza server amali orqali
-- (service role) yoziladi va u spamdan himoyalangan.

create table if not exists demo_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  center_name text not null,
  contact_name text not null,
  phone text not null,
  comment text,
  status text not null default 'new' check (status in ('new', 'contacted', 'opened', 'rejected')),
  note text
);

create index if not exists demo_requests_created_idx on demo_requests (created_at desc);
alter table demo_requests enable row level security;

drop policy if exists demo_requests_admin on demo_requests;
create policy demo_requests_admin on demo_requests for all
  using (coalesce(public.is_platform_admin(), false))
  with check (coalesce(public.is_platform_admin(), false));
