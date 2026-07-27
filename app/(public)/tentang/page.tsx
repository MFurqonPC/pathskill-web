import { GraduationCap, Compass, ArrowLeftRight, Code2 } from "lucide-react";

const AUDIENCE = [
  {
    icon: GraduationCap,
    text: "Mahasiswa IT yang ingin tahu kesiapan kerjanya sejak dini",
  },
  {
    icon: Compass,
    text: "Fresh graduate yang bingung mulai belajar dari mana",
  },
  {
    icon: ArrowLeftRight,
    text: "Siapa pun yang mau pindah jalur karier ke bidang IT",
  },
];

export default function TentangPage() {
  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-5 py-16">
        <h1 className="text-[#0B1739] text-3xl md:text-4xl font-bold mb-2">
          Tentang PathSkill
        </h1>
        <div
          className="w-16 h-1 rounded-full bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 mb-8"
          aria-hidden="true"
        />

        <div className="text-gray-600 space-y-5 leading-relaxed">
          <p>
            Banyak mahasiswa dan fresh graduate IT di Indonesia lulus dengan
            skillset yang belum tentu selaras dengan apa yang dicari
            industri. Bukan karena kurang belajar — tapi karena nggak ada
            cara mudah untuk tahu <em>di mana posisi skill mereka sekarang</em>{" "}
            dibanding standar yang dibutuhkan.
          </p>
          <p>
            PathSkill dibuat untuk menutup gap itu. Kami membantu kamu
            memetakan skill yang sudah dimiliki, membandingkannya dengan
            kebutuhan role incaran (Full Stack Developer, Backend Developer,
            UI/UX Designer, DevOps Engineer, atau Data Analyst), lalu
            menyusun jalur belajar yang benar-benar personal — disusun oleh
            AI berdasarkan hasil assessment kamu sendiri, bukan kurikulum
            generik yang sama untuk semua orang.
          </p>
        </div>

        <h2 className="text-[#0B1739] text-xl font-bold mt-10 mb-3">
          Misi Kami
        </h2>
        <p className="border-l-4 border-blue-500 pl-4 text-gray-700 leading-relaxed">
          Membuat proses &ldquo;siap kerja&rdquo; di bidang IT jadi lebih
          terukur dan terarah untuk mahasiswa dan fresh graduate Indonesia —
          dengan data, bukan tebak-tebakan.
        </p>

        <h2 className="text-[#0B1739] text-xl font-bold mt-10 mb-4">
          Untuk Siapa PathSkill
        </h2>
        <ul className="grid sm:grid-cols-3 gap-3">
          {AUDIENCE.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.text}
                className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-2"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5" aria-hidden="true" />
                </div>
                <span className="text-sm text-gray-600 leading-relaxed">
                  {item.text}
                </span>
              </li>
            );
          })}
        </ul>

        <h2 className="text-[#0B1739] text-xl font-bold mt-10 mb-3">
          Tim
        </h2>
        <div className="border border-gray-100 rounded-2xl p-5 flex items-start gap-3">
          <div className="w-9 h-9 shrink-0 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Code2 className="w-4.5 h-4.5" aria-hidden="true" />
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            PathSkill dikembangkan sebagai proyek pembelajaran oleh mahasiswa
            D3 Teknik Informatika, dengan fokus penerapan arsitektur
            fullstack modern (Laravel API + Next.js) dan integrasi AI untuk
            personalisasi pembelajaran.
          </p>
        </div>
      </div>
    </div>
  );
}