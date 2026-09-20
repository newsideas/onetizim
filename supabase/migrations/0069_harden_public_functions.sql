-- 0069_harden_public_functions.sql
-- Xavfsizlik: Postgres funksiyalarga standart holatda hammaga (hatto kirmagan foydalanuvchiga ham) ruxsat beradi,
-- Supabase esa ularni /rest/v1/rpc/... orqali ochadi. Quyidagilar boshqa markaz ma'lumotini oshkor qilardi:
--   * default_cashbox(p_org)  — istalgan markazning kassa id'sini qaytaradi (yo'q bo'lsa yangi kassa yozadi);
--   * org_is_active(p_org)    — istalgan markaz faolmi-yo'qmi, kirmagan foydalanuvchiga ham ko'rinardi;
--   * get_invite / accept_invite — taklif oqimi olib tashlangan, endi kerak emas.
-- default_cashbox faqat bazadagi trigger ichida (funksiya egasi huquqi bilan) chaqiriladi, tashqaridan kerak emas.

revoke execute on function public.default_cashbox(uuid) from public, anon, authenticated;

-- RLS siyosatlari ichida is_org_member orqali chaqiriladi (u ham security definer), shuning uchun tizimga
-- kirganlarda qoladi, kirmaganlardan olinadi.
revoke execute on function public.org_is_active(uuid) from public, anon;
grant execute on function public.org_is_active(uuid) to authenticated;

revoke execute on function public.get_invite(uuid) from public, anon, authenticated;
revoke execute on function public.accept_invite(uuid) from public, anon, authenticated;
