import { buildWhatsAppLink } from "@/lib/site-config";
import { Sprout, Rocket, Target, Check } from "lucide-react";

const PACKAGES = [
  {
    icon: Sprout,
    name: "Starter",
    price: "Gratis",
    period: "",
    description: "Cocok untuk kamu yang baru mau mulai mengenali skill gap.",
    features: [
      "1x Skill Assessment",
      "1 Learning Path dasar (non-AI)",
      "Akses komunitas belajar",
      "Dashboard progress dasar",
    ],
    highlight: false,
  },
  {
    icon: Rocket,
    name: "Pro",
    price: "Rp49.000",
    period: "/bulan",
    description:
      "Untuk yang serius mengejar target karier dalam beberapa bulan.",
    features: [
      "Unlimited Skill Assessment",
      "Learning Path personalisasi AI (Groq)",
      "Semua modul & assignment praktis",
      "Sertifikat penyelesaian modul",
      "Dashboard progress lengkap",
    ],
    highlight: true,
  },
  {
    icon: Target,
    name: "Career Mentor",
    price: "Rp199.000",
    period: "/bulan",
    description:
      "Dampingan personal biar nggak salah arah dan lebih cepat siap kerja.",
    features: [
      "Semua fitur Pro",
      "1:1 mentoring session (2x/bulan)",
      "Review portfolio & CV",
      "Prioritas job-matching partner",
      "Grup diskusi eksklusif mentor",
    ],
    highlight: false,
  },
];

export default function LayananPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-[#0B1739]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(600px circle at 20% 0%, rgba(147,51,234,0.35), transparent 60%), radial-gradient(500px circle at 85% 20%, rgba(37,99,235,0.35), transparent 60%)",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-24 text-center">
          <span className="inline-block bg-white/10 text-white/80 text-xs font-semibold tracking-wide px-3 py-1 rounded-full mb-4">
            PAKET & HARGA
          </span>

          <h1 className="text-white text-3xl md:text-5xl font-bold mb-3 tracking-tight">
            Paket Layanan PathSkill
          </h1>

          <p className="text-white/60 max-w-xl mx-auto text-base md:text-lg">
            Pilih paket yang sesuai dengan seberapa serius kamu mau
            mempercepat kesiapan kerja di bidang IT.
          </p>
        </div>
      </div>

      {/* Pricing */}
      <div className="max-w-6xl mx-auto px-5 -mt-14 pb-16">
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PACKAGES.map((pkg) => {
            const Icon = pkg.icon;

            return (
              <div
                key={pkg.name}
                className={`group relative rounded-2xl p-6 flex flex-col transition-all duration-200 ${
                  pkg.highlight
                    ? "order-first md:order-none bg-[#0B1739] text-white shadow-2xl shadow-purple-900/30 ring-1 ring-purple-400/60 md:-mt-4 md:mb-4 hover:-translate-y-1"
                    : "bg-white border border-gray-200 text-[#0B1739] shadow-sm hover:shadow-lg hover:-translate-y-1"
                }`}
              >
                {pkg.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                    Paling Populer
                  </span>
                )}

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    pkg.highlight
                      ? "bg-white/10 text-white"
                      : "bg-blue-50 text-blue-600"
                  }`}
                >
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>

                <h2 className="text-xl font-bold mb-1">{pkg.name}</h2>

                <p
                  className={`text-sm mb-4 min-h-[2.5rem] ${
                    pkg.highlight ? "text-white/60" : "text-gray-500"
                  }`}
                >
                  {pkg.description}
                </p>

                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{pkg.price}</span>
                  <span
                    className={
                      pkg.highlight ? "text-white/60" : "text-gray-400"
                    }
                  >
                    {pkg.period}
                  </span>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {pkg.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          pkg.highlight
                            ? "text-teal-400"
                            : "text-teal-600"
                        }`}
                        aria-hidden="true"
                      />

                      <span
                        className={
                          pkg.highlight
                            ? "text-white/80"
                            : "text-gray-600"
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={buildWhatsAppLink(
                    `Halo, saya ingin memesan paket ${pkg.name} PathSkill.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-center font-semibold py-3 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    pkg.highlight
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 focus-visible:ring-purple-400 focus-visible:ring-offset-[#0B1739]"
                      : "bg-[#0B1739] text-white hover:bg-[#0B1739]/90 focus-visible:ring-[#0B1739] focus-visible:ring-offset-white"
                  }`}
                >
                  Pesan via WhatsApp
                </a>
              </div>
            );
          })}
        </div>

        <p className="text-center text-gray-400 text-sm mt-12">
          Butuh paket khusus untuk kampus/kelompok belajar?{" "}
          <a
            href={buildWhatsAppLink(
              "Halo, saya ingin tanya paket khusus untuk kampus/kelompok."
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline underline-offset-2 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
          >
            Hubungi kami
          </a>
        </p>
      </div>
    </div>
  );
}