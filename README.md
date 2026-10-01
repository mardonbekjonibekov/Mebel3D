# Mebel3D

Mebel do'konlari uchun 3D / AR savdo tizimi: onlayn katalog, 3D ko'rish va AR, AI qidiruv va AI interyer stilist, Telegram bot, admin panel hamda rasmlardan / telefon skaneri orqali 3D model yaratish.

Texnologiyalar: Next.js 16 (App Router), React 19, Prisma + SQLite, Tailwind CSS 4, `<model-viewer>`, TensorFlow.js (brauzerda), Apple Object Capture (macOS).

## Lokal ishga tushirish

```bash
npm install
cp .env.example .env          # qiymatlarni to'ldiring
npx prisma migrate deploy     # bazani yaratadi
node prisma/seed.js           # ixtiyoriy: demo katalog (haqiqiy do'kon bazasida ishlatmang)
npm run dev                   # http://localhost:3000
```

Admin panel: `/admin` (login va parol `.env` dagi `ADMIN_USER` / `ADMIN_PASSWORD`).

## Serverga joylash (Linux VPS)

Talablar: Node.js 20.9+, kamida 2 GB RAM (build uchun), domen va HTTPS (kamera, AR va Telegram webhook uchun shart).

```bash
git clone git@github.com:mardonbekjonibekov/Mebel3D.git && cd Mebel3D
npm ci
cp .env.example .env          # ADMIN_PASSWORD, SITE_URL, Telegram qiymatlarini kiriting
npx prisma migrate deploy
npm run build
npm start -- -p 3000          # pm2 yoki systemd orqali doimiy ishga tushiring
```

Nginx'ni `localhost:3000` ga reverse proxy qiling va Certbot bilan SSL oling. Yuklanadigan fayllar (3D model, video) uchun Nginx'da `client_max_body_size 200m;` qo'ying.

Telegram botni ulash (bir marta):

```bash
node scripts/telegram.mjs webhook https://sizning-domen.uz
node scripts/telegram.mjs commands
```

Lokal sinovda webhook o'rniga: `npm run tg:poll -- http://localhost:3000`.

### Saqlanadigan ma'lumotlar

Quyidagilar git'da yo'q — ularni zaxiralang va yangilashda o'chirib yubormang:

- `prisma/dev.db` — mahsulotlar, buyurtmalar, sozlamalar
- `uploads/` — yuklangan rasmlar, 3D modellar, videolar
- `.env` — parollar va tokenlar

### Rasmlardan 3D yaratish

Apple Object Capture faqat Apple Silicon (M1 va yangi) Mac'da ishlaydi. Linux serverda admin panelda bu funksiya "faqat Mac serverda ishlaydi" degan xabar beradi, qolgan barcha qismlar odatdagidek ishlaydi. Mac'da Swift dasturi (`scripts/photogrammetry/main.swift`) birinchi ishga tushishda o'zi `.tools/photogrammetry` ga kompilyatsiya qilinadi (Xcode Command Line Tools kerak).

## Foydali buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `npm run lint` | ESLint tekshiruvi |
| `npm run lint:tw` / `lint:tw:fix` | Tailwind klasslarini kanonik shaklga keltirish |
| `npm run tg:info` | Bot ma'lumoti |
| `npm run tg:commands` | Botdagi "Menu" buyruqlarini ro'yxatdan o'tkazish |
