import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "3D skanerlash qo'llanmasi" };

const STEPS = [
  { t: "Ilovani o'rnating", d: "Scaniverse (iPhone va Android, bepul) yoki RealityScan (Epic Games, bepul). iPhone Pro / iPad Pro'da LiDAR bor, u aniqlikni oshiradi, lekin shart emas." },
  { t: "Mebelni tayyorlang", d: "Mebelni xonaning o'rtasiga, atrofiga 1-1,5 metr bo'sh joy qoldirib qo'ying. Yorug' va bir tekis yoritilgan joy tanlang (kunduzgi yorug'lik yaxshi). Ustidagi mayda narsalarni olib tashlang." },
  { t: "Atrofida aylanib skanerlang", d: "Skanerlashni boshlang va mebel atrofida sekin, to'liq bir aylanib chiqing. Keyin telefonni balandroq ko'tarib yana bir aylaning (yuqori qismi uchun). Oxirida past burchakdan oyoqlarini ham oling. Telefonni tez siltamang." },
  { t: "Ortiqcha joyni kesing", d: "Ilova modelni qayta ishlagach, pol va atrofdagi narsalarni «Crop» (kesish) vositasi bilan olib tashlang. Faqat mebelning o'zi qolsin." },
  { t: "GLB formatida eksport qiling", d: "Share / Export bo'limida GLB ni tanlang. Sifatni «Medium» qiling: fayl 5-30 MB bo'ladi, sayt tez ochiladi. iPhone'da USDZ ham bersa, uni ham saqlang." },
  { t: "Admin panelga yuklang", d: "Mahsulot qo'shish sahifasida .glb faylni tanlang. Model darhol aylantirib ko'rsatiladi va o'lchami avtomatik aniqlanadi." },
  { t: "O'lchamni tekshiring", d: "«O'lcham maydonlariga yozish» tugmasini bosing yoki haqiqiy o'lchamni o'zingiz kiriting. Agar model o'lchami haqiqiy mebeldan farq qilsa, ogohlantirish chiqadi. AR'da to'g'ri kattalik ko'rinishi uchun bu muhim." },
];

const TIPS = [
  ["Yaxshi ishlaydi", "Mat (yaltiramaydigan) mato, yog'och, oddiy rangli sirtlar. Teksturasi bor mebel."],
  ["Yomon ishlaydi", "Oyna, yaltiroq metall, qora va bir rangli silliq sirtlar, ingichka simli oyoqlar. Bunday mebel uchun modelni qo'lda tuzatish kerak bo'lishi mumkin."],
  ["Katta mebel", "Shkaf, divan kabi katta mebelni 2-3 marta skanerlab ko'ring. Eng yaxshisini tanlang."],
  ["Bir necha rang", "Bitta mebelning turli ranglari uchun har birini alohida skanerlash shart emas: bitta model + mahsulotning tavsifida ranglarni yozing."],
];

export default function GuidePage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold">3D skanerlash qo&apos;llanmasi</h1>
        <p className="mt-2 text-slate-600">
          Mebelning 3D modelini telefon bilan, bepul yasash yo&apos;li. Bir mahsulotga taxminan 10-15 daqiqa ketadi. Ilovalarning menyu nomlari versiyaga qarab biroz farq qilishi mumkin.
        </p>
      </div>

      <ol className="space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.t} className="animate-fade-up flex gap-4 rounded-2xl bg-white border border-slate-200 p-4 md:p-5" style={{ animationDelay: `${i * 50}ms` }}>
            <span className="h-9 w-9 shrink-0 rounded-xl bg-brand-gradient text-white font-bold grid place-items-center shadow-lg shadow-orange-500/30">{i + 1}</span>
            <div>
              <p className="font-bold">{s.t}</p>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>

      <section>
        <h2 className="text-lg font-bold mb-3">Maslahatlar</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {TIPS.map(([t, d]) => (
            <div key={t} className="rounded-2xl bg-white border border-slate-200 p-4">
              <p className="font-semibold text-sm">{t}</p>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-slate-900 text-white p-5 text-sm leading-relaxed">
        <p className="font-bold">Ilova .glb bermasa (masalan Kiri Engine OBJ beradi)?</p>
        <p className="mt-1 text-slate-300">
          Hech narsa qilish shart emas: OBJ faylni (.zip holida, ichida .obj, .mtl va rasm bilan) mahsulot formasidagi 3D model maydoniga shundayligicha tanlang.
          Sayt uni o&apos;zi .glb ga aylantiradi va oldindan ko&apos;rsatadi. Boshqa formatlar (.usdz, .fbx) uchun Blender (bepul) da File - Export - glTF 2.0 (.glb) ishlating.
        </p>
      </section>

      <Link href="/admin/products/new" className="btn-primary inline-block px-6 py-3 text-sm">Mahsulot qo&apos;shishga o&apos;tish</Link>
    </div>
  );
}
