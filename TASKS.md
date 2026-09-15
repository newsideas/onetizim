# IPRO TIZIM — ish rejasi

Ta'lim muassasalari uchun yagona boshqaruv tizimi. Ro'yxatdan o'tishda
muassasa turi tanlanadi va butun interfeys o'shanga moslashadi:

| Segment | Guruhlash | Vaqt birligi | O'ziga xos |
|---|---|---|---|
| **Xususiy maktab** | Sinf (1-A, 5-B) | O'quv yili + chorak | Ko'p fanli jadval, baho jurnali, turniket |
| **Bog'cha** | Yosh guruhi (Kichik/O'rta/Katta) | O'quv yili | Tibbiy ma'lumot, ovqatlanish, kelish–ketish, kim olib ketdi |
| **O'quv markaz** | Guruh (kurs bo'yicha) | Uzluksiz (oylik) | Sinov darsi, kurs narxi |

Raqobatchilar: **Edu tizim** (faqat markazlar), **My School** (faqat maktablar).
Bizning farqimiz — uchala segment bitta tizimda va **Telegram bot** (ular SMS
ishlatadi yoki umuman yo'q).

---

## Holat belgilari

- ✅ Tayyor
- 🚧 Jarayonda
- ⬜ Boshlanmagan

---

## TAYYOR (asos)

| | Modul |
|---|---|
| ✅ | Auth: ro'yxatdan o'tish, kirish, sessiya himoyasi (`proxy.ts`), RLS |
| ✅ | Dashboard layout: sidebar, header, dark theme, mobil drawer |
| ✅ | Guruhlar: ro'yxat, detal sahifasi, tahrirlash |
| ✅ | O'quvchilar: ro'yxat, kartochka, holatlar (aktiv/muzlatilgan/arxiv) |
| ✅ | Davomat: guruh+sana bo'yicha, bir bosishda saqlash |
| ✅ | To'lovlar: kiritish, jurnal, balans triggeri, oylik hisob (`charges`) |
| ✅ | Qarzdorlar ro'yxati |
| ✅ | Telegram bot: ulash, davomat/to'lov/qarzdorlik xabarlari |
| ✅ | Dars jadvali: haftalik va xonalar bo'yicha kunlik ko'rinish |
| ✅ | Xonalar va kurslar katalogi |
| ✅ | Bosh sahifa statistikasi (4 karta) |

---

## 1-BOSQICH — Segment tizimi (poydevor)

Butun tizim shunga tayanadi, shuning uchun birinchi.

- ⬜ `organizations.type` ga `bogcha` qo'shish (hozir `togarak` | `maktab`)
- ⬜ Ro'yxatdan o'tishda uch segment tanlovi (ikonka + tavsif bilan)
- ⬜ Segment kontekstini butun ilovaga uzatish (server + client)
- ⬜ Segmentga qarab atamalar: "Guruh" / "Sinf" / "Yosh guruhi",
      "O'quvchi" / "Bola", "Dars" / "Mashg'ulot"
- ⬜ Segmentga qarab sidebar: keraksiz bo'limlar yashiriladi
- ⬜ Sozlamalarda segmentni ko'rsatish (o'zgartirish — faqat qo'llab-quvvatlash orqali)

## 2-BOSQICH — Moliya (eng katta bo'shliq)

Hozir faqat tushum bor — foyda/zarar ko'rsatib bo'lmaydi.

- ⬜ `expenses` jadvali + ikki bosqichli kategoriyalar
- ⬜ Standart xarajat kategoriyalari (tizim bilan keladi):
      Xodimlar · Bino/kommunal · O'quv jarayoni · IT · Marketing ·
      O'quvchilar · Boshqaruv · Soliq · Favqulodda
- ⬜ Tushum kategoriyalari (o'quv to'lovi, ovqat, qo'shimcha xizmat, boshqa)
- ⬜ Xarajat kiritish formasi (sana, kategoriya, summa, izoh, hujjat)
- ⬜ Kassa: kirim/chiqim, joriy qoldiq
- ⬜ Xodimlar maoshi (hisoblash + to'lash)
- ⬜ Foyda hisoboti: tushum − xarajat, davr kesimida
- ⬜ Moliyaviy tahlil: oy/chorak/yil, guruh/sinf kesimida

## 3-BOSQICH — Rollar va foydalanuvchilar

Hozir faqat tashkilot egasi kira oladi.

- ⬜ `org_members` jadvali (foydalanuvchi ↔ tashkilot ↔ rol)
- ⬜ Rollar: Direktor · Administrator · Kassir · O'qituvchi/Tarbiyachi · Hisobchi
- ⬜ Har rol uchun ruxsatlar matritsasi
- ⬜ RLS policy'larni `owner_id` dan a'zolikka o'tkazish
- ⬜ Xodimni tizimga taklif qilish (login yaratish)
- ⬜ Ruxsat yetmaganda — tushunarli sahifa (404 emas)

## 4-BOSQICH — Shartnomalar

Maktab va bog'cha uchun majburiy, markaz uchun ixtiyoriy.

- ⬜ `contracts` jadvali: raqam, sana, muddat, summa, to'lov jadvali, holat
- ⬜ To'lov jadvali (oylik/choraklik bo'lib to'lash)
- ⬜ Qarzdorlikni shartnomadan hisoblash (hozir `charges` dan)
- ⬜ Shartnoma shabloni va chop etish (PDF)
- ⬜ Shartnomalar ro'yxati va hisoboti

## 5-BOSQICH — Kengaytirilgan o'quvchi bazasi

Shartnoma rasmiy hujjat bo'lgani uchun to'liq ma'lumot kerak.

- ⬜ Shaxsiy: FISH, tug'ilgan sana, jinsi, millati, rasm
- ⬜ Tug'ilganlik guvohnomasi (seriya, raqam)
- ⬜ Pasport / JSHSHIR (katta yoshlilar uchun)
- ⬜ Ota-ona/vasiy: FISH, qarindoshlik, pasport, JSHSHIR, telefon (bir nechta)
- ⬜ Manzil: viloyat, tuman, to'liq manzil
- ⬜ **Bog'cha uchun**: tibbiy ma'lumot (allergiya, surunkali kasallik, dori),
      bolani olib ketishga ruxsat berilgan shaxslar ro'yxati
- ⬜ Import (Excel) + shablon yuklab olish
- ⬜ Export
- ⬜ Arxiv va qidiruv-filtr (viloyat, sinf, jinsi, holati)

## 6-BOSQICH — CRM / Lidlar

- ⬜ `leads` jadvali: ota-ona, bola, telefonlar, qiziqayotgan sinf/guruh,
      manba, menejer, daraja (past/o'rta/qaynoq), teglar
- ⬜ Kanban voronka: Yangi → Aloqada → Sinov darsi/Uchrashuv → Shartnoma → Rad
- ⬜ Lid tarixi (izohlar, qo'ng'iroqlar, vazifalar)
- ⬜ Vazifalar va eslatmalar
- ⬜ Lidni o'quvchiga aylantirish (bir bosishda)
- ⬜ Konversiya hisoboti (manba kesimida)

## 7-BOSQICH — O'quv jarayoni (segmentga qarab)

**Maktab:**
- ⬜ Sinflar (parallel: 1-A, 1-B), sinf rahbari
- ⬜ O'quv yili va choraklar
- ⬜ Fanlar va o'qituvchi biriktirish
- ⬜ Ko'p fanli dars jadvali (sinf × kun × juftlik)
- ⬜ Baho jurnali, chorak/yillik baho
- ⬜ Uy vazifalari

**Bog'cha:**
- ⬜ Yosh guruhlari va tarbiyachilar
- ⬜ Kun tartibi (mashg'ulot, ovqat, uyqu)
- ⬜ Kelish–ketish vaqti va kim olib ketdi
- ⬜ Ovqatlanish hisobi (kunlik)
- ⬜ Rivojlanish kuzatuvi (baho o'rniga)

**O'quv markaz:**
- ⬜ Sinov darsi
- ⬜ Kurs dasturi va bosqichlari
- ⬜ Sertifikat

## 8-BOSQICH — Hisobotlar

- ⬜ Moliyaviy: tushum/xarajat/foyda (oy, chorak, yil)
- ⬜ Qarzdorlik: o'quvchi, guruh/sinf kesimida
- ⬜ Davomat: kunlik/haftalik/oylik foiz
- ⬜ O'quvchilar harakati: qabul, ketgan, muzlatilgan
- ⬜ Xodimlar: davomat, maosh
- ⬜ Har bir hisobotni Excel/PDF ga chiqarish

## 9-BOSQICH — Filiallar

- ⬜ `branches` jadvali, barcha ma'lumot filialga bog'lanadi
- ⬜ Yuqori paneldan filial almashtirish
- ⬜ Filial kesimida hisobot va "barcha filiallar" ko'rinishi

## 10-BOSQICH — Xabarnomalar

- ⬜ Telegram: shablonlarni sozlash imkoniyati
- ⬜ Ommaviy xabar (guruh/sinf/butun muassasa)
- ⬜ SMS zaxira kanali (Telegram ulanmaganlar uchun)
- ⬜ Avtomatik eslatmalar: to'lov muddati, tug'ilgan kun, davomat
- ⬜ Yuborilgan xabarlar tarixi

## 11-BOSQICH — Tizim sifati

- ⬜ Bo'sh holatlar: har bir blokda "bu yerda nima ko'rinadi" izohi
- ⬜ Onboarding: birinchi kirishda bosqichma-bosqich sozlash
- ⬜ Global qidiruv (Ctrl+K)
- ⬜ Til: o'zbek / rus
- ⬜ Yorug' mavzu (hozir faqat qorong'i)
- ⬜ Har bir jadvalda sahifalash va saralash
- ⬜ Amallar tarixi (audit log)

## 12-BOSQICH — SaaS

- ⬜ Tariflar (o'quvchi soniga qarab)
- ⬜ Sinov muddati va uni ko'rsatish
- ⬜ Balans va to'lov (Click/Payme)
- ⬜ Muddat tugashi haqida ogohlantirish

---

## Ishlash tartibi

1. Har bosqich tugagach — build + lint toza, brauzerda sinaladi, commit qilinadi
2. Baza o'zgarishi bo'lsa — migratsiya fayli yoziladi va SQL Editor'da
   ishga tushiriladi
3. Bosqich yakunida production'ga deploy qilinadi
