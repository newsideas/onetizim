-- 0006_telegram_link.sql
-- Telegram botni ota-ona bilan bog'lash.
--
-- Webhook so'rovi Telegram serveridan keladi — unda foydalanuvchi sessiyasi
-- (auth.uid()) bo'lmaydi, shuning uchun RLS orqali yozib bo'lmaydi.
-- Yechim: service role kaliti (butun bazaga kirish) o'rniga faqat shu bitta
-- amalni bajaruvchi security definer funksiya. Qo'shimcha himoya sifatida
-- webhook route Telegram'ning secret_token headerini ham tekshiradi.

-- Bir chat bir o'quvchiga ikki marta bog'lanmasligi uchun.
alter table telegram_links
  add constraint telegram_links_student_chat_key unique (student_id, chat_id);

create or replace function public.link_telegram_chat(
  p_student_id uuid,
  p_chat_id bigint
)
returns text                    -- o'quvchining ismi, topilmasa null
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name text;
begin
  select full_name into v_full_name
  from students
  where id = p_student_id and status = 'active';

  if v_full_name is null then
    return null;
  end if;

  insert into telegram_links (student_id, chat_id)
  values (p_student_id, p_chat_id)
  on conflict (student_id, chat_id) do nothing;

  update students
  set parent_telegram_chat_id = p_chat_id
  where id = p_student_id;

  return v_full_name;
end;
$$;

grant execute on function public.link_telegram_chat(uuid, bigint) to anon;
