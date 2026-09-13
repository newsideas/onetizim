-- 0004_payment_balance_trigger.sql
-- payments jadvaliga yozuv qo'shilganda students.balance'ni avtomatik
-- oshiradi. Bazada trigger orqali qilinishi (server action ichidagi
-- alohida update o'rniga) balansni har doim to'lov yozuvi bilan
-- muvofiq, race-condition'siz saqlaydi.

create or replace function public.apply_payment_to_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update students
  set balance = balance + new.amount
  where id = new.student_id;
  return new;
end;
$$;

create trigger trg_apply_payment_to_balance
after insert on payments
for each row
execute function apply_payment_to_balance();
