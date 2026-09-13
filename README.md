# To'garak CRM

To'garak va xususiy maktablar uchun boshqaruv tizimi: guruhlar, o'quvchilar,
davomat, to'lovlar va ota-onalarga Telegram orqali avtomatik xabar.

## Stack

- Next.js 16 (App Router, TypeScript) + Tailwind CSS v4
- Supabase (Postgres + Auth + RLS)
- Telegram Bot API (webhook)
- React Hook Form + Zod

## Ishga tushirish (lokal)

```bash
npm install
cp .env.local.example .env.local   # qiymatlarni to'ldiring
npm run dev
```

### Bazani tayyorlash

`supabase/migrations/` ichidagi fayllarni **tartib bilan** Supabase SQL
Editor'da ishga tushiring:

| Fayl | Nima qiladi |
|---|---|
| `0001_init.sql` | Jadvallar (organizations, teachers, groups, students, attendance, payments, telegram_links) + RLS yoqish |
| `0002_policies.sql` | RLS policy'lar — har kim faqat o'z tashkilotining ma'lumotini ko'radi |
| `0003_org_owner_unique.sql` | Bir foydalanuvchi — bitta tashkilot (dublikatlarning oldini oladi) |
| `0004_payment_balance_trigger.sql` | To'lov kiritilganda `students.balance` avtomatik oshadi |
| `0005_monthly_charges.sql` | Oylik hisob (`charges`) — balansdan oylik narx ayiriladi |
| `0006_telegram_link.sql` | Ota-onaning Telegram chat'ini o'quvchiga bog'lash funksiyasi |

### Auth sozlamasi

Supabase → Authentication → Sign In / Providers → Email:

- **Enable email provider** — yoniq
- **Confirm email** — ishlab chiqarishda yoniq bo'lgani ma'qul. O'chirilgan
  bo'lsa ro'yxatdan o'tgan foydalanuvchi darhol kiradi (tez sinov uchun qulay).

Tashkilot yozuvi ro'yxatdan o'tishda emas, foydalanuvchi birinchi marta
kirganda yaratiladi (`lib/supabase/ensureOrganization.ts`) — chunki email
tasdiqlash yoqilganda signUp paytida hali sessiya bo'lmaydi.

## Telegram bot

1. [@BotFather](https://t.me/BotFather) da bot yarating, tokenni
   `TELEGRAM_BOT_TOKEN` ga yozing.
2. `TELEGRAM_WEBHOOK_SECRET` uchun ixtiyoriy maxfiy matn o'ylab toping.
3. Deploy qilgandan so'ng webhook'ni ro'yxatdan o'tkazing:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://<domen>/api/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

> Webhook faqat ochiq HTTPS manzil bilan ishlaydi — `localhost` da Telegram
> update yubora olmaydi.

Ota-ona **Sozlamalar → Telegram bot** sahifasidagi havola orqali botni ochadi
(`https://t.me/<bot>?start=<student_id>`) va shundan keyin quyidagi xabarlarni
oladi: darsga kelmagani, oylik qarzdorlik, to'lov qabul qilingani.

## Oylik hisob

To'lovlar sahifasidagi **"Oylik hisobni yopish"** tugmasi tanlangan oy uchun
barcha aktiv o'quvchilarning balansidan guruhining oylik narxini ayiradi.
Takroriy bosish xavfsiz — bir oy ikki marta hisoblanmaydi
(`charges` jadvalidagi `unique (student_id, period)`).

## Deploy (Vercel)

1. Loyihani Vercel'ga import qiling.
2. Environment Variables bo'limiga `.env.local.example` dagi barcha
   o'zgaruvchilarni qo'shing.
3. Deploy tugagach yuqoridagi `setWebhook` buyrug'ini ishga tushiring.
