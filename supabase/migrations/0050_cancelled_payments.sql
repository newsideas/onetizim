-- 0050_cancelled_payments.sql
-- Bekor qilingan to'lovlar: to'lov bekor qilinganda payments'dan o'chiriladi va shu
-- jadvalga ko'chiriladi. Shunda barcha tushum hisobotlari avtomatik to'g'ri qoladi,
-- o'quvchi balansi esa trigger orqali qaytariladi.
-- Ko'rish: barcha a'zolar; o'zgartirish: direktor va administrator.

create table if not exists cancelled_payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  student_id uuid references students(id) on delete set null,
  student_name text,
  amount numeric not null,
  method text,
  paid_at date,
  note text,
  reason text,
  cancelled_at timestamptz not null default now(),
  cancelled_by uuid references auth.users(id) on delete set null default auth.uid()
);

create index if not exists cancelled_payments_org_idx on cancelled_payments (org_id, cancelled_at desc);

alter table cancelled_payments enable row level security;

drop policy if exists cancelled_payments_read on cancelled_payments;
create policy cancelled_payments_read on cancelled_payments
  for select using (is_org_member(org_id));

drop policy if exists cancelled_payments_manage on cancelled_payments;
create policy cancelled_payments_manage on cancelled_payments
  for all using (can_manage_org(org_id)) with check (can_manage_org(org_id));

-- To'lov o'chirilganda o'quvchi balansi qaytariladi (0004 dagi trigger'ning teskarisi).
create or replace function public.reverse_payment_on_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update students
  set balance = balance - old.amount
  where id = old.student_id;
  return old;
end;
$$;

drop trigger if exists trg_reverse_payment_on_delete on payments;
create trigger trg_reverse_payment_on_delete
after delete on payments
for each row execute function reverse_payment_on_delete();
