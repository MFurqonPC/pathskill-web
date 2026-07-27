"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import type { SkillAssessmentResponse, SkillItem } from "@/types/skill";
import AssessmentStepIndicator from "@/components/AssessmentStepIndicator";
import {
  Code2,
  Database,
  ShieldCheck,
  Smartphone,
  Cloud,
  BrainCircuit,
  LineChart,
  Network,
  Palette,
  Briefcase,
  Wrench,
  Users,
  Info,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = {
  core: "Core Skills",
  tools: "Tools",
  soft_skills: "Soft Skills",
};

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  core: Code2,
  tools: Wrench,
  soft_skills: Users,
};

const RATING_LABEL: Record<number, string> = {
  1: "Pemula",
  2: "Dasar",
  3: "Menengah",
  4: "Mahir",
  5: "Pakar",
};

// Skala warna "skill spectrum": intensitas biru naik seiring level keahlian.
// Dipakai konsisten di rating chip, progress bar, dan panduan skala supaya
// satu bahasa visual yang sama menyampaikan "seberapa jauh" penguasaan skill.
const RATING_COLOR: Record<number, string> = {
  1: "#93c5fd",
  2: "#60a5fa",
  3: "#3b82f6",
  4: "#2563eb",
  5: "#1d4ed8",
};

const SPECTRUM_GRADIENT =
  "linear-gradient(90deg, #93c5fd 0%, #60a5fa 25%, #3b82f6 50%, #2563eb 75%, #1d4ed8 100%)";

// Mapping nama/kata kunci karier ke ikon Lucide, menggantikan emoji dari backend
// (data.career.icon) agar tampilan konsisten profesional di semua device.
const CAREER_ICON_KEYWORDS: Array<[RegExp, React.ComponentType<{ className?: string }>]> = [
  [/data|analy|scien/i, LineChart],
  [/security|cyber|secure/i, ShieldCheck],
  [/mobile|android|ios|flutter/i, Smartphone],
  [/cloud|devops|infra/i, Cloud],
  [/ai|machine|ml|artificial/i, BrainCircuit],
  [/network|it support|sysadmin/i, Network],
  [/design|ui|ux/i, Palette],
  [/database|dba/i, Database],
  [/web|frontend|backend|fullstack|software|developer|engineer/i, Code2],
];

function getCareerIcon(name: string | undefined) {
  if (!name) return Briefcase;
  const match = CAREER_ICON_KEYWORDS.find(([pattern]) => pattern.test(name));
  return match ? match[1] : Briefcase;
}

// Elemen dekoratif konsisten di kedua halaman (dashboard & assessment):
// glow radial lembut di belakang header pada latar navy gelap.
function HeaderGlow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden"
    >
      <div
        className="absolute left-1/2 top-[-140px] h-80 w-[560px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, #2563eb, transparent)",
        }}
      />
    </div>
  );
}

function IconBadge({
  icon: Icon,
  size = "md",
}: {
  icon: React.ComponentType<{ className?: string }>;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-4.5 w-4.5";
  return (
    <span
      className={`flex ${box} shrink-0 items-center justify-center rounded-lg bg-blue-50 transition-colors group-hover:bg-blue-100`}
    >
      <Icon className={`${iconSize} text-blue-600`} aria-hidden="true" />
    </span>
  );
}

export default function SkillAssessmentPage() {
  const { careerId } = useParams<{ careerId: string }>();
  const router = useRouter();

  const [data, setData] = useState<SkillAssessmentResponse | null>(null);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSkills() {
      try {
        const res = await api.get<SkillAssessmentResponse>(
          `/careers/${careerId}/skills`
        );
        setData(res.data);

        // isi state rating dari current_rating yang sudah ada (kalau sebelumnya pernah diisi)
        const initial: Record<number, number> = {};
        Object.values(res.data.skills).forEach((group) => {
          group.forEach((skill) => {
            if (skill.current_rating) initial[skill.id] = skill.current_rating;
          });
        });
        setRatings(initial);
      } catch {
        setError("Gagal memuat data skill assessment.");
      } finally {
        setLoading(false);
      }
    }
    fetchSkills();
  }, [careerId]);

  function handleRate(skillId: number, value: number) {
    setRatings((prev) => ({ ...prev, [skillId]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ratings: Object.entries(ratings).map(([career_skill_id, rating]) => ({
          career_skill_id: Number(career_skill_id),
          rating,
        })),
      };
      await api.post("/skill-assessments", payload);
      router.push(`/skill-assessment/${careerId}/self-assess`);
    } catch {
      setError("Gagal menyimpan skill assessment. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  const totalSkills = data ? Object.values(data.skills).flat().length : 0;
  const totalRated = Object.keys(ratings).length;
  const progressPct = totalSkills > 0 ? Math.round((totalRated / totalSkills) * 100) : 0;

  const CareerIcon = useMemo(() => getCareerIcon(data?.career.name), [data?.career.name]);

  if (loading) {
    return <AssessmentSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1739] px-5 text-center">
        <p className="text-white/70">{error ?? "Data tidak ditemukan."}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0B1739] pb-28 lg:pb-16">
      <SpectrumStyles />
      <HeaderGlow />

      <div className="mx-auto max-w-md px-5 pt-8 md:max-w-5xl md:px-8 md:pt-10 xl:max-w-6xl">
        <AssessmentStepIndicator currentStep={1} />

        <div className="mb-6 mt-4 animate-[fade-in-up_0.5s_ease-out]">
          <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Skill Assessment
          </h1>
          <p className="text-sm leading-relaxed text-white/60 md:max-w-lg">
            Beri nilai tingkat keahlian kamu saat ini pada setiap skill di
            bawah, dari 1 (Pemula) hingga 5 (Pakar).
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">
          {/* Kolom kiri: daftar skill per kategori */}
          <div className="lg:col-span-2">
            {(["core", "tools", "soft_skills"] as const).map((category, idx) => {
              const skills = data.skills[category];
              if (!skills || skills.length === 0) return null;
              const Icon = CATEGORY_ICON[category] ?? Briefcase;

              return (
                <div
                  key={category}
                  className="group mb-4 animate-[fade-in-up_0.5s_ease-out_backwards] rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md md:p-6"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <h2 className="mb-4 flex items-center gap-2.5 font-bold text-[#0B1739]">
                    <IconBadge icon={Icon} size="sm" />
                    {CATEGORY_LABEL[category]}
                    <span className="ml-auto text-xs font-normal text-gray-400">
                      {skills.filter((s) => ratings[s.id]).length}/{skills.length}
                    </span>
                  </h2>
                  <div className="divide-y divide-gray-100">
                    {skills.map((skill: SkillItem) => (
                      <SkillRow
                        key={skill.id}
                        skill={skill}
                        value={ratings[skill.id]}
                        onRate={(v) => handleRate(skill.id, v)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {error && (
              <p
                role="alert"
                className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}
          </div>

          {/* Kolom kanan (desktop): ringkasan karier & progres, sekaligus CTA */}
          <div className="hidden lg:sticky lg:top-6 lg:col-span-1 lg:block">
            <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <CareerIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Karier tujuan</p>
                  <p className="truncate font-semibold text-[#0B1739]">
                    {data.career.name}
                  </p>
                </div>
              </div>

              <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
                <span>
                  {totalRated} dari {totalSkills} skill dinilai
                </span>
                <span className="font-semibold text-blue-600">{progressPct}%</span>
              </div>
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${progressPct}%`, background: SPECTRUM_GRADIENT }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || totalRated === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-600/40 disabled:shadow-none active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    Lanjut ke Step 2
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </>
                )}
              </button>
              {totalRated === 0 && (
                <p className="mt-2 text-center text-[11px] text-gray-400">
                  Nilai minimal satu skill untuk melanjutkan
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 text-sm shadow-sm">
              <p className="mb-3 font-semibold text-[#0B1739]">Panduan Skala</p>
              <div className="mb-3 h-1.5 w-full rounded-full" style={{ background: SPECTRUM_GRADIENT }} />
              <ul className="space-y-2">
                {Object.entries(RATING_LABEL).map(([n, label]) => (
                  <li key={n} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: RATING_COLOR[Number(n)] }}
                      aria-hidden="true"
                    />
                    <span className="text-gray-500">{n} — {label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer khusus mobile & tablet; di desktop CTA sudah ada di sidebar */}
      <div
        className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-[#0B1739]/90 p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.25)] backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-md md:max-w-5xl">
          <div className="mb-2 flex items-center justify-between text-xs text-white/60">
            <span>{totalRated} / {totalSkills} skill sudah dinilai</span>
            <span className="font-semibold text-white">{progressPct}%</span>
          </div>
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${progressPct}%`, background: SPECTRUM_GRADIENT }}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || totalRated === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1739] disabled:bg-blue-600/40 active:scale-[0.98]"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Menyimpan...
              </>
            ) : (
              <>
                Lanjut ke Step 2
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkillRow({
  skill,
  value,
  onRate,
}: {
  skill: SkillItem;
  value: number | undefined;
  onRate: (v: number) => void;
}) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-[#0B1739]">
          {skill.skill_name}
        </span>
        <span
          aria-live="polite"
          className={`flex items-center gap-1 text-xs font-medium transition-colors ${
            value ? "text-blue-600" : "text-gray-400"
          }`}
        >
          {value && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
          {value ? RATING_LABEL[value] : "Belum dinilai"}
        </span>
      </div>
      <div
        role="radiogroup"
        aria-label={`Tingkat keahlian untuk ${skill.skill_name}`}
        className="grid grid-cols-5 gap-2"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          const color = RATING_COLOR[n];
          return (
            <button
              key={n}
              role="radio"
              aria-checked={active}
              title={RATING_LABEL[n]}
              onClick={() => onRate(n)}
              style={
                active
                  ? { backgroundColor: color, borderColor: color }
                  : ({ "--lvl-color": color } as React.CSSProperties)
              }
              className={`rounded-lg border py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 ${
                active
                  ? "-translate-y-0.5 text-white shadow-md shadow-blue-600/25"
                  : "border-gray-200 text-gray-500 hover:-translate-y-0.5 hover:border-[var(--lvl-color)] hover:bg-blue-50/50 hover:text-[#0B1739]"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Keyframes bersama, di-scope lewat styled-jsx-like <style> tag biasa (aman
// tanpa dependency tambahan) dan menghormati preferensi reduced motion.
function SpectrumStyles() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .animate-\\[fade-in-up_0\\.5s_ease-out\\],
        .animate-\\[fade-in-up_0\\.5s_ease-out_backwards\\] {
          animation: none !important;
        }
      }
    `}</style>
  );
}

function AssessmentSkeleton() {
  return (
    <div className="min-h-screen bg-[#0B1739] pb-28">
      <ShimmerStyles />
      <div className="mx-auto max-w-md px-5 pt-8 md:max-w-5xl md:px-8 md:pt-10 xl:max-w-6xl">
        <div className="shimmer mb-4 h-3 w-20 rounded bg-white/10" />
        <div className="shimmer mb-6 h-2 w-full rounded bg-white/10" />
        <div className="shimmer mb-2 h-7 w-56 rounded bg-white/10" />
        <div className="shimmer mb-6 h-4 w-72 rounded bg-white/10" />

        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          <div className="lg:col-span-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="shimmer mb-4 h-56 rounded-2xl bg-white/10" />
            ))}
          </div>
          <div className="hidden lg:block">
            <div className="shimmer mb-5 h-48 rounded-2xl bg-white/10" />
            <div className="shimmer h-40 rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ShimmerStyles() {
  return (
    <style>{`
      .shimmer {
        position: relative;
        overflow: hidden;
      }
      @media (prefers-reduced-motion: no-preference) {
        .shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          animation: shimmer 1.6s infinite;
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      }
    `}</style>
  );
}