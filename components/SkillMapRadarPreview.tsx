"use client";

import { useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ResponsiveContainer,
} from "recharts";

/**
 * Data contoh untuk ilustrasi di landing page.
 *
 * "Standar Industri" (industryRequirement) diambil langsung dari
 * database/seeders/CareerSeeder.php — jadi nilainya SAMA dengan yang
 * dipakai backend di halaman /skill-map asli.
 *
 * "Skill Kamu" (current) TETAP dummy/ilustratif — nilai real user cuma
 * ada setelah dia mengisi skill assessment beneran, jadi di sini cuma
 * contoh gap yang masuk akal biar visualnya nggak kosong.
 */
type CareerId = "fullstack" | "backend" | "uiux" | "devops" | "data";

const CAREERS: { id: CareerId; label: string }[] = [
  { id: "fullstack", label: "Full Stack Developer" },
  { id: "backend", label: "Backend Developer" },
  { id: "uiux", label: "UI/UX Designer" },
  { id: "devops", label: "DevOps Engineer" },
  { id: "data", label: "Data Analyst" },
];

type SkillPoint = {
  skill: string;
  "Skill Kamu": number;
  "Standar Industri": number;
};

/**
 * Label sumbu yang panjang (mis. "Authentication & Security") bisa
 * digambar Recharts sampai keluar batas SVG di layar sempit, karena
 * PolarAngleAxis tidak melakukan wrapping/clipping otomatis — itu yang
 * bikin halaman jadi bisa di-scroll horizontal. Peta ini HANYA mengubah
 * teks yang ditampilkan di axis (lewat tickFormatter di bawah); key data
 * asli ("skill") tetap utuh supaya tetap sama dengan CareerSeeder.php.
 */
const SHORT_SKILL_LABELS: Record<string, string> = {
  "Authentication & Security": "Auth & Security",
  "Git & Version Control": "Git & VCS",
  "Monitoring & Logging": "Monitoring",
  "Wireframing & Prototyping": "Wireframing",
  "Data Visualization": "Data Viz",
  "Databases (SQL/NoSQL)": "Databases",
};

function shortenSkillLabel(label: string) {
  return SHORT_SKILL_LABELS[label] ?? label;
}

// Override outline default browser yang muncul saat elemen SVG recharts
// (polygon radar, focusable untuk aksesibilitas keyboard) di-tap di mobile.
// Tooltip/legend tetap berfungsi normal karena itu event hover/active
// terpisah dari outline fokus ini. Sama persis dengan fix di SkillMapPage.tsx
// (produk asli) supaya konsisten di seluruh aplikasi.
function ChartFocusStyles() {
  return (
    <style>{`
      .recharts-wrapper:focus,
      .recharts-wrapper *:focus,
      .recharts-surface:focus,
      .recharts-surface *:focus {
        outline: none !important;
      }
    `}</style>
  );
}

const DEMO_DATA: Record<CareerId, SkillPoint[]> = {
  fullstack: [
    { skill: "HTML", "Skill Kamu": 3.0, "Standar Industri": 4.2 },
    { skill: "CSS", "Skill Kamu": 3.2, "Standar Industri": 4.2 },
    { skill: "JavaScript", "Skill Kamu": 2.5, "Standar Industri": 4.5 },
    { skill: "PHP", "Skill Kamu": 2.0, "Standar Industri": 4.0 },
    { skill: "SQL", "Skill Kamu": 2.8, "Standar Industri": 4.0 },
    { skill: "Git & Version Control", "Skill Kamu": 3.0, "Standar Industri": 4.3 },
    { skill: "Testing & Debugging", "Skill Kamu": 1.8, "Standar Industri": 4.0 },
    { skill: "Problem Solving", "Skill Kamu": 3.5, "Standar Industri": 4.5 },
    { skill: "Communication", "Skill Kamu": 3.2, "Standar Industri": 4.0 },
  ],
  backend: [
    { skill: "Node.js", "Skill Kamu": 2.2, "Standar Industri": 4.3 },
    { skill: "Databases (SQL/NoSQL)", "Skill Kamu": 3.0, "Standar Industri": 4.5 },
    { skill: "REST APIs", "Skill Kamu": 2.8, "Standar Industri": 4.5 },
    { skill: "Authentication & Security", "Skill Kamu": 1.8, "Standar Industri": 4.2 },
    { skill: "Git & Version Control", "Skill Kamu": 3.0, "Standar Industri": 4.3 },
    { skill: "Testing & Debugging", "Skill Kamu": 2.2, "Standar Industri": 4.2 },
    { skill: "Problem Solving", "Skill Kamu": 3.5, "Standar Industri": 4.6 },
    { skill: "Communication", "Skill Kamu": 3.0, "Standar Industri": 3.8 },
  ],
  uiux: [
    { skill: "HTML", "Skill Kamu": 2.5, "Standar Industri": 3.5 },
    { skill: "CSS", "Skill Kamu": 3.0, "Standar Industri": 3.8 },
    { skill: "JavaScript", "Skill Kamu": 1.8, "Standar Industri": 3.0 },
    { skill: "Wireframing & Prototyping", "Skill Kamu": 3.5, "Standar Industri": 4.5 },
    { skill: "User Research", "Skill Kamu": 2.5, "Standar Industri": 4.3 },
    { skill: "Git & Version Control", "Skill Kamu": 2.0, "Standar Industri": 3.2 },
    { skill: "Testing & Debugging", "Skill Kamu": 2.0, "Standar Industri": 3.5 },
    { skill: "Problem Solving", "Skill Kamu": 3.5, "Standar Industri": 4.3 },
    { skill: "Communication", "Skill Kamu": 3.8, "Standar Industri": 4.5 },
  ],
  devops: [
    { skill: "Docker", "Skill Kamu": 2.0, "Standar Industri": 4.5 },
    { skill: "Kubernetes", "Skill Kamu": 1.5, "Standar Industri": 4.3 },
    { skill: "CI/CD", "Skill Kamu": 2.2, "Standar Industri": 4.4 },
    { skill: "Linux", "Skill Kamu": 3.0, "Standar Industri": 4.4 },
    { skill: "Monitoring & Logging", "Skill Kamu": 1.8, "Standar Industri": 4.0 },
    { skill: "Git & Version Control", "Skill Kamu": 3.2, "Standar Industri": 4.5 },
    { skill: "Testing & Debugging", "Skill Kamu": 2.0, "Standar Industri": 3.8 },
    { skill: "Problem Solving", "Skill Kamu": 3.5, "Standar Industri": 4.6 },
    { skill: "Communication", "Skill Kamu": 3.0, "Standar Industri": 4.0 },
  ],
  data: [
    { skill: "Python", "Skill Kamu": 2.5, "Standar Industri": 4.3 },
    { skill: "SQL", "Skill Kamu": 3.2, "Standar Industri": 4.5 },
    { skill: "R", "Skill Kamu": 1.5, "Standar Industri": 3.5 },
    { skill: "Data Visualization", "Skill Kamu": 2.5, "Standar Industri": 4.2 },
    { skill: "Git & Version Control", "Skill Kamu": 2.0, "Standar Industri": 3.5 },
    { skill: "Testing & Debugging", "Skill Kamu": 1.8, "Standar Industri": 3.5 },
    { skill: "Problem Solving", "Skill Kamu": 3.5, "Standar Industri": 4.5 },
    { skill: "Communication", "Skill Kamu": 3.2, "Standar Industri": 4.2 },
  ],
};

export default function SkillMapRadarPreview() {
  const [career, setCareer] = useState<CareerId>("fullstack");

  return (
    <div className="w-full min-w-0 overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-md p-4 md:p-6">
      <ChartFocusStyles />
      <div className="flex md:flex-wrap md:justify-center gap-1.5 mb-3 overflow-x-auto md:overflow-visible -mx-1 px-1 md:mx-0 md:px-0 pb-1 md:pb-0">
        {CAREERS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCareer(c.id)}
            aria-pressed={career === c.id}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
              career === c.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <RadarChart
          data={DEMO_DATA[career]}
          outerRadius="62%"
          margin={{ top: 16, right: 20, bottom: 8, left: 20 }}
        >
          <PolarGrid />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fontSize: 9 }}
            tickFormatter={shortenSkillLabel}
          />
          <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />

          {/*
            Sama seperti di halaman /skill-map asli: "Standar Industri"
            dirender LEBIH DULU karena nilainya selalu >= "Skill Kamu".
            Recharts menumpuk elemen berikutnya di atas elemen sebelumnya,
            jadi kalau urutannya dibalik, polygon "Skill Kamu" bisa ketutup
            total. Warna, fill, dan opacity DISAMAKAN persis dengan
            SkillMapPage.tsx (produk asli) supaya konsisten.
          */}
          <Radar
            name="Standar Industri"
            dataKey="Standar Industri"
            stroke="#7c3aed"
            fill="#7c3aed"
            fillOpacity={0.25}
          />
          <Radar
            name="Skill Kamu"
            dataKey="Skill Kamu"
            stroke="#2563eb"
            fill="#2563eb"
            fillOpacity={0.35}
          />

          <Legend wrapperStyle={{ fontSize: 11 }} />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-center text-xs text-gray-400 mt-2">
        Contoh ilustrasi — hasilmu sendiri dihitung dari skill assessment.
      </p>
    </div>
  );
}
