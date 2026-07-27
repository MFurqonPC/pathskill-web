"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { TrendingUp, Target, Clock, Sparkles, UserCircle, ShieldCheck } from "lucide-react";
import api from "@/lib/api";
import type { SkillMapResponse } from "@/types/skill";
import { StatusScreen, ErrorScreen } from "@/components/ui/StatusScreen";

type ChartMode = "radar" | "bar";

type SkillMapErrorState =
  | { type: "no_career_goal" }
  | { type: "not_assessed"; careerGoalId: number }
  | { type: "technical"; message: string };

export default function SkillMapPage() {
  const router = useRouter();
  const [data, setData] = useState<SkillMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<SkillMapErrorState | null>(null);
  const [chartMode, setChartMode] = useState<ChartMode>("radar");

  async function fetchSkillMap() {
    setLoading(true);
    setErrorState(null);
    try {
      const res = await api.get<SkillMapResponse>("/skill-map");
      setData(res.data);
    } catch (err: any) {
      const status = err.response?.status;
      const reason = err.response?.data?.reason;

      if (status === 422 && reason === "no_career_goal") {
        setErrorState({ type: "no_career_goal" });
      } else if (status === 422 && reason === "not_assessed") {
        setErrorState({
          type: "not_assessed",
          careerGoalId: err.response.data.career_goal_id,
        });
      } else {
        setErrorState({
          type: "technical",
          message:
            err.response?.data?.message ??
            "Gagal memuat skill map. Periksa koneksi kamu dan coba lagi.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSkillMap();
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.chart_data.map((item) => ({
      skill: item.skill_name,
      "Current Skills": item.is_rated ? item.current : null,
      "Industry Requirements": item.required,
      isRated: item.is_rated,
      isQuizValidated: item.is_quiz_validated,
      isConfidenceValidated: item.is_confidence_validated,
    }));
  }, [data]);

  const hasUnratedSkills = chartData.some((d) => !d.isRated);
  const fullyValidatedCount = chartData.filter((d) => d.isRated && d.isQuizValidated).length;

  if (loading) {
    return <SkillMapSkeleton />;
  }

  if (errorState?.type === "no_career_goal") {
    return (
      <StatusScreen
        icon={UserCircle}
        title="Kamu belum memilih karier tujuan"
        description="Isi dulu profil dan karier tujuanmu supaya kami bisa menyiapkan Skill Map yang sesuai."
        actionLabel="Lengkapi Profil"
        onAction={() => router.push("/profile-setup")}
      />
    );
  }

  if (errorState?.type === "not_assessed") {
    return (
      <StatusScreen
        icon={Target}
        title="Skill Map kamu belum tersedia"
        description="Selesaikan Skill Assessment dulu supaya kami bisa memetakan kemampuanmu dibanding kebutuhan industri."
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
        onRetry={fetchSkillMap}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1739] pb-16">
      <div className="max-w-md md:max-w-5xl xl:max-w-6xl mx-auto px-5 md:px-8 pt-10">
        <h1 className="text-white text-2xl md:text-3xl xl:text-4xl font-bold mb-1 md:mb-2">
          Your Skill Map
        </h1>
        <p className="text-white/70 text-sm mb-6 md:max-w-xl">
          Lihat bagaimana keterampilan Anda dibandingkan dengan persyaratan
          industri.
        </p>

        <div className="md:grid md:grid-cols-3 md:gap-6 md:items-start">
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <SummaryCard
                label="Tingkat Saat Ini"
                value={data.summary.current_level}
                sub="Gabungan self-rating, confidence & quiz"
                color="text-blue-600"
              />
              <SummaryCard
                label="Tingkat yang Diperlukan"
                value={data.summary.required_level}
                sub="Standar industri"
                color="text-purple-600"
              />
              <SummaryCard
                label="Kesenjangan Keterampilan"
                value={data.summary.skill_gap}
                sub="Poin yang perlu ditingkatkan"
                color="text-orange-500"
              />
            </div>

            <div className="bg-white rounded-2xl p-4 mb-6">
              <p className="text-gray-500 text-xs mb-3">
                Tingkat Saat Ini dihitung dari 3 sumber:
              </p>
              <BreakdownRow
                label="Self-Rating (Step 1)"
                value={`${data.summary.breakdown.self_rating.toFixed(1)} / 5`}
              />
              <BreakdownRow
                label="Scenario Confidence (Step 2)"
                value={
                  data.summary.breakdown.scenario_confidence !== null
                    ? `${data.summary.breakdown.scenario_confidence.toFixed(1)} / 5`
                    : "Belum diisi"
                }
              />
              <BreakdownRow
                label="Skill Verification Quiz (Step 3)"
                value={
                  data.summary.breakdown.quiz_score_percentage !== null
                    ? `${data.summary.breakdown.quiz_score_percentage}% benar`
                    : "Belum diisi"
                }
              />
            </div>

            <div className="bg-white rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="font-bold text-[#0B1739] text-center">
                  Skills Analysis
                </h2>
              </div>
              {chartData.length > 0 && (
                <p className="text-center text-xs text-gray-400 mb-4 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-500" aria-hidden="true" />
                  {fullyValidatedCount} dari {chartData.length} skill sudah divalidasi quiz
                </p>
              )}

              {chartData.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-12">
                  Belum ada data skill untuk career ini.
                </p>
              ) : (
                <>
                  {hasUnratedSkills && (
                    <p className="mb-3 text-center text-xs text-orange-500">
                      Beberapa skill belum dinilai dan tidak ditampilkan di
                      chart.
                    </p>
                  )}

                  <div className="flex justify-center mb-4">
                    <div className="inline-flex bg-gray-100 rounded-xl p-1">
                      <button
                        onClick={() => setChartMode("radar")}
                        aria-pressed={chartMode === "radar"}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                          chartMode === "radar"
                            ? "bg-blue-600 text-white"
                            : "text-gray-500"
                        }`}
                      >
                        Radar Chart
                      </button>
                      <button
                        onClick={() => setChartMode("bar")}
                        aria-pressed={chartMode === "bar"}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                          chartMode === "bar"
                            ? "bg-blue-600 text-white"
                            : "text-gray-500"
                        }`}
                      >
                        Bar Chart
                      </button>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={360}>
                    {chartMode === "radar" ? (
                      <RadarChart data={chartData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const point = payload[0].payload;
                            return (
                              <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm text-xs">
                                <p className="font-semibold text-[#0B1739] mb-1">{point.skill}</p>
                                <p className="text-blue-600">
                                  Current: {point["Current Skills"] === null ? "Belum dinilai" : point["Current Skills"].toFixed(1)}
                                </p>
                                <p className="text-purple-600">
                                  Required: {point["Industry Requirements"].toFixed(1)}
                                </p>
                                {point.isRated && (
                                  <p className="text-gray-400 mt-1">
                                    {point.isQuizValidated ? "✓ Divalidasi quiz" : "Self-rating only"}
                                  </p>
                                )}
                              </div>
                            );
                          }}
                        />
                        <Radar
                          name="Current Skills"
                          dataKey="Current Skills"
                          stroke="#2563eb"
                          fill="#2563eb"
                          fillOpacity={0.35}
                          connectNulls={false}
                        />
                        <Radar
                          name="Industry Requirements"
                          dataKey="Industry Requirements"
                          stroke="#7c3aed"
                          fill="#7c3aed"
                          fillOpacity={0.25}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </RadarChart>
                    ) : (
                      <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ left: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} />
                        <YAxis
                          type="category"
                          dataKey="skill"
                          tick={{ fontSize: 10 }}
                          width={90}
                        />
                        <Tooltip
                          formatter={(value: number | null) =>
                            value === null ? "Belum dinilai" : value.toFixed(1)
                          }
                        />
                        <Bar
                          dataKey="Current Skills"
                          fill="#2563eb"
                          radius={[0, 4, 4, 0]}
                        />
                        <Bar
                          dataKey="Industry Requirements"
                          fill="#7c3aed"
                          radius={[0, 4, 4, 0]}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </>
              )}
            </div>
          </div>

          <div className="md:col-span-1">
            {data.recommendation && (
              <div className="bg-white rounded-2xl p-4 mb-6">
                <h2 className="font-bold text-[#0B1739] flex items-center gap-2 mb-3">
                  <TrendingUp
                    className="w-4 h-4 text-green-600"
                    aria-hidden="true"
                  />
                  Rekomendasi
                </h2>

                <RecommendationRow
                  icon={
                    <Target className="w-4 h-4 text-blue-600" aria-hidden="true" />
                  }
                  title="Fondasi yang Kuat"
                  body={data.recommendation.foundation_summary}
                  borderColor="border-blue-500"
                />

                <div className="border-l-4 border-purple-500 pl-3 py-1 mb-3">
                  <p className="text-sm font-semibold text-[#0B1739] flex items-center gap-1.5">
                    <Sparkles
                      className="w-4 h-4 text-purple-600"
                      aria-hidden="true"
                    />
                    Area Prioritas
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {data.recommendation.priority_areas}
                  </p>
                  {data.recommendation.priority_skill_names.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {data.recommendation.priority_skill_names.map((name) => (
                        <span
                          key={name}
                          className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <RecommendationRow
                  icon={
                    <Clock className="w-4 h-4 text-green-600" aria-hidden="true" />
                  }
                  title="Perkiraan Garis Waktu"
                  body={`Dengan usaha yang konsisten, Anda dapat mencapai tingkat keterampilan yang dibutuhkan dalam waktu sekitar ${data.recommendation.estimated_weeks} minggu dengan mengikuti jalur pembelajaran personal kami.`}
                  borderColor="border-green-500"
                  last
                />
              </div>
            )}

            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-5 mb-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" aria-hidden="true" />
                <h2 className="font-bold text-lg">
                  Rekomendasi Jalur Belajar oleh AI
                </h2>
              </div>
              <p className="text-white/80 text-sm mb-4">
                AI kami menganalisis hasil skill assessment dan skill map anda
                untuk menyusun urutan modul pembelajaran yang paling relevan
                dengan gap skill dan kebutuhan industri saat ini.
              </p>

              <div className="bg-white/10 rounded-xl p-3 mb-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-300" />
                  Analisis Gap Skill
                </p>
                <p className="text-xs text-white/70 mt-1">
                  Mengidentifikasi kesenjangan antara skill saat ini dan
                  kebutuhan industri
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 mb-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                  Personalisasi Konten
                </p>
                <p className="text-xs text-white/70 mt-1">
                  Menyesuaikan urutan modul berdasarkan profil dan tujuan
                  karier anda
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 mb-4">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
                  Optimalisasi Waktu
                </p>
                <p className="text-xs text-white/70 mt-1">
                  Menentukan jalur tercepat untuk mencapai target skill level
                  anda
                </p>
              </div>

              <button
                onClick={() => router.push("/learning-path")}
                className="w-full bg-white text-[#0B1739] font-semibold py-3 rounded-xl flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-purple-600"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                Generate Learning Path dengan AI
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-[#0B1739] font-medium">{value}</span>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value.toFixed(1)}</p>
      <p className="text-gray-400 text-xs">{sub}</p>
    </div>
  );
}

function RecommendationRow({
  icon,
  title,
  body,
  borderColor,
  last = false,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  borderColor: string;
  last?: boolean;
}) {
  return (
    <div
      className={`border-l-4 ${borderColor} pl-3 py-1 ${last ? "" : "mb-3"}`}
    >
      <p className="text-sm font-semibold text-[#0B1739] flex items-center gap-1.5">
        {icon}
        {title}
      </p>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{body}</p>
    </div>
  );
}

function SkillMapSkeleton() {
  return (
    <div className="min-h-screen bg-[#0B1739] pb-16 animate-pulse">
      <div className="max-w-md md:max-w-5xl xl:max-w-6xl mx-auto px-5 md:px-8 pt-10">
        <div className="h-7 md:h-9 w-48 bg-white/10 rounded-lg mb-3" />
        <div className="h-4 w-full max-w-md bg-white/10 rounded mb-6" />

        <div className="md:grid md:grid-cols-3 md:gap-6 md:items-start">
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white/5 rounded-2xl h-24" />
              ))}
            </div>
            <div className="bg-white/5 rounded-2xl h-28 mb-6" />
            <div className="bg-white/5 rounded-2xl h-96" />
          </div>
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white/5 rounded-2xl h-56" />
            <div className="bg-white/5 rounded-2xl h-72" />
          </div>
        </div>
      </div>
    </div>
  );
}