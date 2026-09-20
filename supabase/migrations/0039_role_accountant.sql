-- 0039_role_accountant.sql
-- Yangi rol: Buxgalter (faqat moliya). Enum qiymati alohida faylda qo'shiladi:
-- yangi qiymatni shu tranzaksiyada ishlatib bo'lmaydi (0040 da ishlatiladi).

alter type org_role add value if not exists 'accountant';
