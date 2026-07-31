import Link from "next/link";
import { buildWhatsAppLink } from "@/lib/site-config";
import { PACKAGES, ctaLabel } from "@/lib/packages";
import SkillMapRadarPreview from "@/components/SkillMapRadarPreview";
import {
  Compass,
  Route,
  TrendingUp,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Compass,
    title: "Kenali Posisi Skill Kamu",
    desc: "Isi skill assessment singkat. Kami bandingkan hasilnya dengan standar skill yang dibutuhkan role incaranmu di industri.",
    color: "teal",
  },
  {
    icon: Route,
    number: "02",
    title: "Dapatkan Jalur Belajar Personal",
    desc: "AI menyusun urutan modul berdasarkan gap skill kamu — bukan kurikulum generik yang sama untuk semua orang.",
    color: "blue",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Kerjakan Assignment & Pantau Progres",
    desc: "Latihan berbasis studi kasus kerja nyata, dengan skill map yang ter-update setiap kamu menyelesaikan modul.",
    color: "purple",
  },
] as const;

const STEP_COLORS = {
  teal: {
    iconBg: "bg-teal-50",
    iconText: "text-teal-600",
    ring: "group-hover:ring-teal-200",
  },
  blue: {
    iconBg: "bg-blue-50",
    iconText: "text-blue-600",
    ring: "group-hover:ring-blue-200",
  },
  purple: {
    iconBg: "bg-purple-50",
    iconText: "text-purple-600",
    ring: "group-hover:ring-purple-200",
  },
} as const;

export default function HomePage() {
  return (
    <div>
      {/* HERO */}
      <section className="bg-[#0B1739] relative overflow-hidden">
        {/* ambient glow, murni dekoratif */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl motion-safe:animate-pulse"
          aria-hidden="true"
        />

        <div className="max-w-6xl mx-auto px-5 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center relative">
          <div className="text-center md:text-left">
            <p className="inline-flex items-center gap-1.5 text-teal-400 text-[10px] sm:text-xs font-semibold tracking-wide mb-5 bg-teal-400/10 px-3 py-1.5 rounded-full text-center">
              <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              UNTUK MAHASISWA & FRESH GRADUATE IT
            </p>
            <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight mb-5">
              Skill kamu di mana?
              <br />
              Industri butuhnya apa?
            </h1>
            <p className="text-white/60 text-base mb-8 max-w-md mx-auto md:mx-0">
              PathSkill memetakan kesenjangan skill kamu terhadap standar
              industri, lalu menyusun jalur belajar personal yang disusun AI —
              bukan kursus generik yang sama untuk semua orang.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-10">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1739] focus-visible:ring-blue-400"
              >
                Mulai Gratis
                <ArrowRight
                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/layanan"
                className="border border-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1739] focus-visible:ring-white/40"
              >
                Lihat Paket
              </Link>
            </div>

            {/* trust strip - ganti angka dengan data asli sebelum rilis */}
            <div className="flex items-center justify-center md:justify-start gap-6 text-white/50 text-xs">
              <span>Tanpa kartu kredit</span>
              <span className="w-1 h-1 rounded-full bg-white/20" aria-hidden="true" />
              <span>Skill assessment 10 menit</span>
            </div>
          </div>

          {/* Signature visual: jalur skill map, echo dari onboarding produk */}
          <div className="relative">
            <svg
              viewBox="0 0 400 320"
              className="w-full max-w-md mx-auto"
              role="img"
              aria-label="Ilustrasi jalur belajar dari skill saat ini menuju siap kerja"
            >
              <path
                d="M 30 280 Q 100 260, 130 190 T 230 130 T 370 40"
                fill="none"
                stroke="#1E2A5E"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                className="motion-safe:[animation:pathflow_3.5s_linear_infinite]"
                d="M 30 280 Q 100 260, 130 190 T 230 130 T 370 40"
                fill="none"
                stroke="url(#pathGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="2 10"
              />
              <defs>
                <linearGradient id="pathGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#14b8a6" />
                  <stop offset="50%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>

              {/* milestone 1: current skill */}
              <circle cx="30" cy="280" r="10" fill="#14b8a6" />
              <text x="48" y="285" fill="#ffffff" fontSize="13" fontWeight="600">
                Skill saat ini
              </text>

              {/* milestone 2: learning */}
              <circle cx="230" cy="130" r="10" fill="#2563eb" />
              <text x="248" y="135" fill="#ffffff" fontSize="13" fontWeight="600">
                Belajar terarah
              </text>

              {/* milestone 3: goal */}
              <circle cx="370" cy="40" r="12" fill="#7c3aed" />
              <text x="330" y="24" fill="#ffffff" fontSize="13" fontWeight="600">
                Siap kerja
              </text>
            </svg>
          </div>
        </div>

        <style>{`
          @keyframes pathflow {
            to { stroke-dashoffset: -120; }
          }
        `}</style>
      </section>

      {/* CARA KERJA - sequence beneran, bukan feature grid generik */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-5">
          <h2 className="text-[#0B1739] text-3xl font-bold text-center mb-3">
            Bagaimana PathSkill Membantu Kamu
          </h2>
          <p className="text-gray-500 text-center mb-14 max-w-xl mx-auto">
            Tiga langkah berurutan dari &ldquo;belum tahu harus mulai dari
            mana&rdquo; sampai punya jalur belajar yang jelas.
          </p>

          <div className="relative grid md:grid-cols-3 gap-8 md:gap-6">
            {/* garis penghubung gradient, hanya terlihat di desktop */}
            <div
              className="hidden md:block absolute top-9 left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-teal-300 via-blue-300 to-purple-300"
              aria-hidden="true"
            />

            {STEPS.map((step) => {
              const Icon = step.icon;
              const colors = STEP_COLORS[step.color];
              return (
                <div
                  key={step.title}
                  className={`group relative bg-white rounded-2xl border border-gray-100 p-6 shadow-sm ring-1 ring-transparent transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${colors.ring}`}
                >
                  <span
                    className="pointer-events-none absolute top-3 right-4 text-5xl sm:text-6xl font-black tabular-nums select-none text-[#0B1739]/[0.06]"
                    aria-hidden="true"
                  >
                    {step.number}
                  </span>

                  <div
                    className={`relative z-10 w-12 h-12 shrink-0 rounded-xl flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-105 ${colors.iconBg} ${colors.iconText}`}
                  >
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>

                  <h3 className="relative z-10 font-bold text-[#0B1739] text-lg mb-2">
                    {step.title}
                  </h3>
                  <p className="relative z-10 text-gray-500 text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* PREVIEW SKILL MAP - contoh visual hasil step 1 */}
          <div className="mt-20 grid md:grid-cols-2 gap-10 items-start">
            <div>
              <span className="inline-block bg-blue-50 text-blue-600 text-xs font-semibold tracking-wide px-3 py-1.5 rounded-full mb-4">
                CONTOH HASIL
              </span>
              <h3 className="text-[#0B1739] text-2xl font-bold mb-3">
                Skill Map Personal Kamu
              </h3>
              <p className="text-gray-500 mb-5 leading-relaxed">
                Setelah skill assessment, kamu langsung dapat gambaran visual
                seberapa jauh skill kamu dibanding standar industri untuk
                role incaranmu — supaya kamu tahu persis apa yang perlu
                diprioritaskan duluan. Tersedia untuk 5 jalur karier: Full
                Stack Developer, Backend Developer, UI/UX Designer, DevOps
                Engineer, dan Data Analyst.
              </p>
              <ul className="space-y-2.5 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Check
                    className="w-4 h-4 shrink-0 mt-0.5 text-teal-600"
                    aria-hidden="true"
                  />
                  Dibandingkan langsung dengan standar role incaranmu
                </li>
                <li className="flex items-start gap-2">
                  <Check
                    className="w-4 h-4 shrink-0 mt-0.5 text-teal-600"
                    aria-hidden="true"
                  />
                  Ter-update setiap kamu menyelesaikan modul
                </li>
                <li className="flex items-start gap-2">
                  <Check
                    className="w-4 h-4 shrink-0 mt-0.5 text-teal-600"
                    aria-hidden="true"
                  />
                  Jadi dasar penyusunan jalur belajar oleh AI
                </li>
              </ul>
            </div>

            <div className="min-w-0">
              <SkillMapRadarPreview />
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-[#0B1739] text-3xl font-bold mb-3">
              Pilih Paket Sesuai Kebutuhanmu
            </h2>
            <p className="text-gray-500">Mulai gratis, upgrade kapan saja.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PACKAGES.map((p) => {
              const Icon = p.icon;

              return (
                <div
                  key={p.id}
                  className={`group relative rounded-2xl p-6 flex flex-col h-full transition-all duration-200 ${
                    p.highlight
                      ? "order-first md:order-none bg-[#0B1739] text-white shadow-2xl shadow-purple-900/30 ring-1 ring-purple-400/60 md:-mt-4 md:mb-4 hover:-translate-y-1"
                      : "bg-white border border-gray-200 text-[#0B1739] shadow-sm hover:shadow-lg hover:-translate-y-1"
                  }`}
                >
                  {p.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                      Paling Populer
                    </span>
                  )}

                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      p.highlight
                        ? "bg-white/10 text-white"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>

                  <p className="font-bold text-xl mb-1">{p.name}</p>

                  <p
                    className={`text-sm mb-4 min-h-[2.5rem] ${
                      p.highlight ? "text-white/60" : "text-gray-500"
                    }`}
                  >
                    {p.description}
                  </p>

                  <p className="mb-5">
                    <span className="text-3xl font-bold">{p.price}</span>
                    <span
                      className={`text-sm ml-1 ${
                        p.highlight ? "text-white/60" : "text-gray-400"
                      }`}
                    >
                      {p.period}
                    </span>
                  </p>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            p.highlight ? "text-teal-400" : "text-teal-600"
                          }`}
                          aria-hidden="true"
                        />
                        <span className={p.highlight ? "text-white/80" : "text-gray-600"}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {p.id === "starter" ? (
                    <Link
                      href="/register"
                      className={`text-center font-semibold px-5 py-2.5 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                        p.highlight
                          ? "bg-white text-[#0B1739] hover:opacity-90"
                          : "bg-gray-100 text-[#0B1739] hover:bg-gray-200"
                      }`}
                    >
                      {ctaLabel(p.id)}
                    </Link>
                  ) : (
                    <a
                      href={buildWhatsAppLink(
                        `Halo, saya ingin memesan paket ${p.name} PathSkill.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-center font-semibold px-5 py-2.5 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                        p.highlight
                          ? "bg-white text-[#0B1739] hover:opacity-90"
                          : "bg-gray-100 text-[#0B1739] hover:bg-gray-200"
                      }`}
                    >
                      {ctaLabel(p.id)}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA PENUTUP */}
      <section className="bg-[#0B1739] py-16">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-white text-2xl md:text-3xl font-bold mb-3">
            Siap tahu di mana posisi skill kamu sekarang?
          </h2>
          <p className="text-white/60 mb-8">
            Selesaikan skill assessment gratis dan lihat jalur belajarmu dalam
            hitungan menit.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold px-7 py-3.5 rounded-xl hover:opacity-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1739] focus-visible:ring-blue-400"
          >
            Mulai Skill Assessment
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}