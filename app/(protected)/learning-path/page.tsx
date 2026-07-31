"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  BookOpen,
  FileText,
  Clock,
  ChevronRight,
  Lightbulb,
  RefreshCcw,
  UserCircle,
  Target,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { LearningPathResponse } from "@/types/learning-path";
import { StatusScreen, ErrorScreen } from "@/components/ui/StatusScreen";

type LearningPathErrorState =
  | { type: "no_career_goal" }
  | { type: "not_assessed"; careerGoalId: number }
  | { type: "plan_required" }
  | { type: "technical"; message: string };

export default function LearningPathPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  console.log("DEBUG authUser:", authUser);
  const [data, setData] = useState<LearningPathResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [needsGenerate, setNeedsGenerate] = useState(false);
  const [errorState, setErrorState] = useState<LearningPathErrorState | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // "Effective free" kalau plan free ATAU plan berbayar tapi sudah lewat
  // tanggal expired — supaya UI tetap benar walau kolom `plan` di DB
  // belum sempat "diturunkan" balik ke free oleh proses manapun.
  // Dipertahankan sebagai lapis kedua untuk kasus race-condition
  // (mis. token lama dipakai sesaat setelah plan expired) — backend
  // (403 plan_required) tetap jadi sumber kebenaran utama sekarang.
  const isPlanExpired =
    authUser?.plan !== "free" &&
    authUser?.plan_expires_at !== null &&
    authUser?.plan_expires_at !== undefined &&
    new Date(authUser.plan_expires_at) < new Date();

  const isFreePlan = authUser?.plan === "free" || isPlanExpired;

  async function fetchLearningPath() {
    setLoading(true);
    setErrorState(null);
    try {
      const res = await api.get<LearningPathResponse>("/learning-path");
      setData(res.data);
      setNeedsGenerate(res.data.modules.length === 0);
    } catch (err: any) {
      const status = err.response?.status;
      const reason = err.response?.data?.reason;

      if (status === 403) {
        setErrorState({ type: "plan_required" });
      } else if (status === 422 && reason === "no_career_goal") {
        setErrorState({ type: "no_career_goal" });
      } else if (status === 422 && reason === "not_assessed") {
        setErrorState({
          type: "not_assessed",
          careerGoalId: err.response.data.career_goal_id,
        });
      } else {
        setErrorState({
          type: "technical",
          message: err.response?.data?.message ?? "Gagal memuat learning path.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLearningPath();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    try {
      await api.post("/learning-path/generate");
      await fetchLearningPath();
    } catch (err: any) {
      if (err.response?.status === 403) {
        setGenerateError(
          "Fitur ini khusus paket Pro atau Career Mentor. Upgrade dulu untuk generate learning path dengan AI."
        );
      } else {
        setGenerateError(
          err.response?.data?.message ??
            "Gagal generate learning path. Coba lagi."
        );
      }
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return <LearningPathSkeleton />;
  }

  if (errorState?.type === "plan_required") {
    return (
      <StatusScreen
        icon={Sparkles}
        title="Fitur Pro"
        description="Learning Path dengan rekomendasi AI khusus untuk pengguna paket Pro atau Career Mentor. Upgrade dulu untuk mengakses fitur ini."
        actionLabel="Lihat Paket Pro"
        onAction={() => router.push("/layanan")}
      />
    );
  }

  if (errorState?.type === "no_career_goal") {
    return (
      <StatusScreen
        icon={UserCircle}
        title="Kamu belum memilih karier tujuan"
        description="Isi dulu profil dan karier tujuanmu supaya kami bisa menyiapkan learning path yang sesuai."
        actionLabel="Lengkapi Profil"
        onAction={() => router.push("/profile-setup")}
      />
    );
  }

  if (errorState?.type === "not_assessed") {
    return (
      <StatusScreen
        icon={Target}
        title="Skill Assessment kamu belum selesai"
        description="Selesaikan Skill Assessment dulu supaya kami bisa menyiapkan learning path yang sesuai dengan skill gap kamu."
        actionLabel="Mulai Skill Assessment"
        onAction={() =>
          router.push(`/skill-assessment/${errorState.careerGoalId}`)
        }
      />
    );
  }

  if (errorState?.type === "technical" || !data) {
    return (
      <ErrorScreen
        message={
          errorState?.type === "technical"
            ? errorState.message
            : "Terjadi kesalahan saat memuat data."
        }
        onRetry={fetchLearningPath}
      />
    );
  }

  const progressPct =
    (data.overall_progress.completed_modules /
      Math.max(data.overall_progress.total_modules, 1)) *
    100;

  return (
    <div className="min-h-screen bg-[#0B1739] pb-16">
      <div className="max-w-md md:max-w-5xl xl:max-w-6xl mx-auto px-5 md:px-8 pt-10">
        <h1 className="text-white text-2xl md:text-3xl xl:text-4xl font-bold mb-1 md:mb-2">
          Your Learning Path
        </h1>
        <p className="text-white/70 text-sm mb-3 md:max-w-xl">
          Ikuti peta jalan yang dipersonalisasi ini untuk mencapai tujuan
          karir Anda.
        </p>

        {!needsGenerate && (
          <div className="inline-flex items-center gap-1.5 bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Sparkles
              className="w-3.5 h-3.5 text-purple-300"
              aria-hidden="true"
            />
            Direkomendasikan AI
          </div>
        )}

        {generateError && (
          <div className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">
            <span>{generateError}</span>
            {isFreePlan ? (
              <Link
                href="/layanan"
                className="flex items-center gap-1 text-xs font-semibold text-red-200 hover:text-white shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
              >
                Lihat Paket
              </Link>
            ) : (
              <button
                onClick={handleGenerate}
                className="flex items-center gap-1 text-xs font-semibold text-red-200 hover:text-white shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
              >
                <RefreshCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Coba lagi
              </button>
            )}
          </div>
        )}

        {needsGenerate ? (
          isFreePlan ? (
            <div className="bg-white rounded-2xl p-6 text-center max-w-md mx-auto md:mx-0">
              <p className="text-gray-500 text-sm mb-4">
                Learning Path yang dipersonalisasi AI adalah fitur paket Pro.
                Upgrade dulu untuk mendapatkan jalur belajar yang disesuaikan
                dengan skill gap kamu.
              </p>
              <Link
                href="/layanan"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                Lihat Paket Pro
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 text-center max-w-md mx-auto md:mx-0">
              <p className="text-gray-500 text-sm mb-4">
                Belum ada learning path untuk career ini. Generate otomatis
                berdasarkan hasil Skill Assessment kamu.
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                {generating
                  ? "Menyusun learning path dengan AI..."
                  : "Generate Learning Path dengan AI"}
              </button>
            </div>
          )
        ) : (
          data && (
            // Sidebar (Overall Progress + Tips) di col-span-1 kiri,
            // Learning Modules di col-span-2 kanan.
            <div className="md:grid md:grid-cols-3 md:gap-6 md:items-start">
              {/* mb-6 md:mb-0 di sini penting: gap-6 dari parent grid
                 cuma aktif di md ke atas. Di mobile (bukan grid),
                 sidebar & kolom kanan numpuk block biasa tanpa gap,
                 jadi butuh margin manual ini supaya jaraknya konsisten
                 dengan gap-gap lain (mb-6) di section ini. */}
              <div className="md:col-span-1 md:sticky md:top-6 md:max-h-[calc(100vh-3rem)] md:overflow-y-auto mb-6 md:mb-0">
                <h2 className="text-white font-semibold mb-3">
                  Ringkasan
                </h2>
                <div className="bg-white rounded-2xl p-5 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-[#0B1739] text-sm">
                      Overall Progress
                    </span>
                    <span className="text-blue-600 text-sm font-medium">
                      {data.overall_progress.completed_modules} /{" "}
                      {data.overall_progress.total_modules} Modules
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2 mb-4">
                    <div
                      className="bg-blue-600 h-1.5 md:h-2 rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <StatRow
                    icon={
                      <BookOpen
                        className="w-4 h-4 text-blue-600"
                        aria-hidden="true"
                      />
                    }
                    label="Total Lessons"
                    value={data.total_lessons}
                    bg="bg-blue-50"
                    valueColor="text-blue-600"
                  />
                  <StatRow
                    icon={
                      <FileText
                        className="w-4 h-4 text-purple-600"
                        aria-hidden="true"
                      />
                    }
                    label="Total Assignments"
                    value={data.total_assignments}
                    bg="bg-purple-50"
                    valueColor="text-purple-600"
                  />
                  <StatRow
                    icon={
                      <Clock
                        className="w-4 h-4 text-green-600"
                        aria-hidden="true"
                      />
                    }
                    label="Estimated Duration"
                    value={`${data.estimated_duration_weeks} weeks`}
                    bg="bg-green-50"
                    valueColor="text-green-600"
                    last
                  />
                </div>

                <div className="bg-blue-600 rounded-2xl p-4 text-white text-sm">
                  <div className="flex items-center gap-2 font-semibold">
                    <Lightbulb className="w-4 h-4" aria-hidden="true" />
                    <span>Tips Belajar</span>
                  </div>
                  <p className="mt-1 text-white/90">
                    Selesaikan modul secara berurutan — tiap modul dirancang
                    membangun fondasi untuk modul berikutnya, sesuai
                    kesenjangan skill yang paling prioritas.
                  </p>
                </div>
              </div>
              {/* end kolom kiri (sidebar) */}

              <div className="md:col-span-2">
                <h2 className="text-white font-semibold mb-3">
                  Learning Modules
                </h2>
                {/* auto-fit (bukan auto-fill) supaya baris terakhir yang
                   tidak penuh tidak menyisakan kolom kosong — card yang
                   tersisa melebar mengisi ruang. */}
                <div className="md:grid md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] md:gap-3">
                  {data.modules.map((module, idx) => (
                    <Link
                      key={module.id}
                      href={`/learning-path/${module.id}`}
                      className="block bg-white rounded-2xl p-4 mb-3 md:mb-0 hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className="font-medium text-[#0B1739] text-sm leading-snug line-clamp-2"
                              title={module.title}
                            >
                              {module.title}
                            </p>
                            <ChevronRight
                              className="w-4 h-4 text-gray-400 shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                          </div>
                          {module.ai_generated && (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full mt-1">
                              <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                              AI
                            </span>
                          )}
                          <p className="text-xs text-gray-400 flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1">
                              <BookOpen
                                className="w-3 h-3"
                                aria-hidden="true"
                              />
                              {module.total_lessons} Lessons
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText
                                className="w-3 h-3"
                                aria-hidden="true"
                              />
                              {module.total_assignments} Assignments
                            </span>
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              {/* end kolom kanan (Learning Modules) */}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  bg,
  valueColor,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bg: string;
  valueColor: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${bg} rounded-xl px-3 py-2.5 ${
        last ? "" : "mb-2"
      }`}
      title={label}
    >
      <span className="flex items-center gap-2 text-sm text-gray-600">
        {icon}
        {label}
      </span>
      <span className={`font-bold ${valueColor}`}>{value}</span>
    </div>
  );
}

function LearningPathSkeleton() {
  return (
    <div className="min-h-screen bg-[#0B1739] pb-16 animate-pulse">
      <div className="max-w-md md:max-w-5xl xl:max-w-6xl mx-auto px-5 md:px-8 pt-10">
        <div className="h-7 md:h-9 w-56 bg-white/10 rounded-lg mb-3" />
        <div className="h-4 w-full max-w-md bg-white/10 rounded mb-6" />

        <div className="md:grid md:grid-cols-3 md:gap-6 md:items-start">
          <div className="md:col-span-1 mb-6 md:mb-0">
            <div className="h-5 w-24 bg-white/10 rounded mb-3" />
            <div className="bg-white/5 rounded-2xl p-5 mb-6 space-y-3">
              <div className="h-4 w-32 bg-white/10 rounded" />
              <div className="h-1.5 w-full bg-white/10 rounded-full" />
              <div className="h-10 w-full bg-white/10 rounded-xl" />
              <div className="h-10 w-full bg-white/10 rounded-xl" />
              <div className="h-10 w-full bg-white/10 rounded-xl" />
            </div>
            <div className="h-20 w-full bg-white/5 rounded-2xl" />
          </div>

          <div className="md:col-span-2">
            <div className="h-5 w-40 bg-white/10 rounded mb-3" />
            <div className="md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white/5 rounded-2xl p-4 mb-3 md:mb-0 h-20"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}