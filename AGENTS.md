<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# To'garak CRM — loyiha qoidalari

- Barcha UI matnlari o'zbek tilida (lotin yozuvi).
- Pul birligi har doim "so'm", minglik ajratgich bo'sh joy (masalan 200 000) — `lib/utils/currency.ts` dagi `formatSom()` orqali.
- Balans manfiy bo'lsa — qizil rang va "Qarzdor" belgisi (`components/payments/BalanceBadge.tsx`).
- Sana formati: kun.oy.yil (masalan 11.09.2026) — `lib/utils/date.ts` dagi `formatDate()` orqali.
- Har bir server action Supabase RLS (row level security) orqali faqat o'z tashkilotining (org_id) ma'lumotlarini qaytarishi shart.
- Yangi komponent yozishda mavjud `components/ui/` ichidagilardan foydalan, qaytadan yaratma.
- Next.js 16: `params`/`searchParams`/`cookies()`/`headers()` async — har doim `await` qilinadi (sinxron kirish mavjud emas).
- Loyiha bosqichma-bosqich quriladi (`togarok-crm-struktura-va-prompt.md` dagi 11 bosqich) — bir vaqtda bir modul, keyingisiga o'tishdan oldin tasdiqlab olinadi.
