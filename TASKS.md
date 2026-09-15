# EduGram — My School bilan bir xil tuzilma

Maqsad: `crm.my-school.uz` tizimidagi barcha bo'limlarni bir xil qilib
qurish, keyin kerakli joylarini o'zgartirish.

Manba tuzilma (2026-09-15 holatiga) — 13 bo'lim, 57 sahifa.

## Har bir sahifaning umumiy andozasi

My School'da barcha ro'yxat sahifalari bir xil skeletga ega, shuning
uchun uni bir marta komponent qilib yozamiz:

| Qism | Tarkibi |
|---|---|
| Sarlavha | Bo'lim nomi + "… ro'yxati" / "… menyusi" |
| Amallar | `Qo'shish`, ba'zan `Import`, `Import shabloni`, `Tarix`, `Arxiv` |
| Tablar | ba'zi sahifalarda: `Faol` / `Bekor qilingan` |
| Filtrlar | matn maydonlari + `Tanlang` select'lari + `Tozalash` / `Qidirish` |
| Jadval | `#` ustuni + ma'lumot ustunlari + `YARATILGAN SANA` + `AMALLAR` |
| Bo'sh holat | "Hech qanday ma'lumot topilmadi" |
| Sahifalash | "1-N / Jami: M" |

Komponentlar: `ListPageShell`, `FilterBar`, `DataTable`.

## Bo'limlar va sahifalar

### 1. Bosh sahifa — `/`
Umumiy ko'rsatkichlar, moliyaviy faollik, moliyaviy tahlil, oylar
kesimida shartnomalar statistikasi.

### 2. CRM
- `/crm/potential-clients` — Lidlar
- `/crm/reports` — Hisobotlar
- `/crm/tasks` — Vazifalar
- `/crm/calls` — Qo'ng'iroqlar
- `/crm/settings` — Sozlamalar
- `/crm/target-links` — Target linklari

### 3. Veb sayt — `/website`

### 4. O'quvchilar
- `/students/base` — O'quvchilar bazasi
  (FISH, tug'ilgan sana, pasport/guvohnoma, qabul qilingan yili,
  ota-ona/vasiy, hudud, yaratilgan sana; filtrlar: viloyat, tuman,
  sinf, jinsi, millati, holati; `Arxiv`, `Import`, `Import shabloni`)
- `/students/list` — O'quvchilar ro'yxati
- `/students/assign` — O'quvchini biriktirish
- `/students/reports` — O'quvchilar hisoboti

### 5. Shartnomalar
- `/contracts/assign` — Shartnoma belgilash
  (FISH, ota-ona/vasiy, sinf, o'quv yili, shartnomalar, summasi,
  fayli; tablar: Faol / Bekor qilingan)
- `/contracts/payment-monitoring` — To'lov monitoringi
- `/contracts/reports` — Shartnomalar hisoboti
- `/contracts/demos` — Shartnoma shablonlari
- `/contracts/amounts` — Shartnoma summalari
- `/contracts/types` — Shartnoma turlari
- `/contracts/discounts` — Shartnoma chegirmalari
- `/contracts/audits` — Bank rekvizitlari

### 6. Moliya
- `/cashbox` — Kassa
- `/cashbox-reports` — Kassa hisoboti
- `/finance` — Kategoriyalar hisoboti
- `/receipts` — O'quvchi to'lovlari
- `/expenses` — Xarajatlar
  (tranzaksiya raqami, davr, umumiy xarajat, aniqlanganlar,
  aniqlanmaganlar, aniqlik kiritiladiganlar, biriktirgan foydalanuvchi)
- `/categories-income` — Tushumlar kategoriyasi
- `/categories-expense` — Xarajatlar kategoriyasi

### 7. HR
- `/employees-salary` — Xodimlar maoshi
- `/employees-list` — Xodimlar
  (FISH, foydalanuvchi roli, lavozim, telefon, holati)

### 8. Davomat
- `/attendances-employees` — Xodimlar
- `/attendances-students` — O'quvchilar
- `/attendances-turnstile` — Turniket sozlamalari
- `/attendances-guide` — Yo'riqnoma

### 9. O'quv bo'limi
- `/education/class-schedule` — Dars jadvali
- `/education/reports` — Hisobotlar
- `/education/exams` — Imtihonlar
- `/education/trainings` — Mashg'ulot turlari
- `/education/subjects` — Fanlar
- `/education/lesson-times` — Dars vaqtlari
- `/education/academic-periods` — Akademik davrlar
- `/education/buildings` — Binolar
- `/education/classrooms` — Auditoriyalar (nomi, kodi, bino nomi, bino kodi)

### 10. Foydalanuvchilar
- `/users/employees` — Xodimlar
- `/users/parents` — Ota-onalar

### 11. Xabarnomalar
- `/notifications/reestrs` — SMS reestrlari
- `/notifications/messages` — Xabarlar
- `/notifications/sms-settings` — SMS sozlamalari

### 12. Sozlamalar
- `/settings/academic-years` — O'quv yillari
  (o'quv yili, ta'lim turi, boshlanish, tugash, joriy o'quv yili)
- `/settings/classes` — Sinflar
  (sinf, sinf kodi, sinf turi, o'quv yili, smenalar, ta'lim tili,
  o'quvchi sig'imi)
- `/settings/class-types` — Sinf turlari
- `/settings/class-change` — Sinfni o'zgartirish
- `/settings/smena` — Smenalar
- `/settings/academic-languages` — Ta'lim tillari
- `/settings/menus` — Menyular
- `/settings/client-branding` — Maktab ma'lumotlari

### 13. Balans — `/balance`

## Qurish tartibi (bog'liqlik bo'yicha)

Ma'lumotnomalar birinchi, chunki qolgan hamma bo'lim ularga tayanadi.

- [ ] **A. Skelet** — sidebar 13 bo'lim + submenyular, `ListPageShell`,
      `FilterBar`, `DataTable`, barcha 57 route
- [ ] **B. Ma'lumotnomalar** — o'quv yillari, sinf turlari, smenalar,
      ta'lim tillari, binolar, auditoriyalar, fanlar, dars vaqtlari,
      akademik davrlar, mashg'ulot turlari, sinflar
- [ ] **C. O'quvchilar** — bazasi, ro'yxati, biriktirish, arxiv, hisobot
- [ ] **D. Shartnomalar** — turlari, summalari, chegirmalari,
      shablonlari, bank rekvizitlari, belgilash, to'lov monitoringi
- [ ] **E. Moliya** — kassa, kategoriyalar, to'lovlar, xarajatlar,
      hisobotlar
- [ ] **F. HR** — xodimlar, lavozimlar, maosh
- [ ] **G. Davomat** — xodimlar, o'quvchilar, turniket
- [ ] **H. O'quv bo'limi** — dars jadvali, imtihonlar, hisobotlar
- [ ] **I. CRM** — lidlar, vazifalar, qo'ng'iroqlar, target linklari
- [ ] **J. Foydalanuvchilar, Xabarnomalar, Balans, Veb sayt**

## Segment farqi

My School faqat maktab uchun. Bizda uch segment bor, shuning uchun
bo'lim nomlari `lib/segment.ts` atamalaridan olinadi: maktabda "Sinflar",
bog'cha va markazda "Guruhlar". Tuzilma bir xil, nomlar moslashadi.
