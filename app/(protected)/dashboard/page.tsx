"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { DashboardResponse } from "@/types/dashboard";
import {
  TrendingUp,
  BookOpen,
  FileText,
  Clock,
  Compass,
  Sparkles,
  Lightbulb,
  ChevronRight,
  BarChart3,
  UserCircle,
  Target,
} from "lucide-react";
import { StatusScreen, ErrorScreen } from "@/components/ui/StatusScreen";

const STATUS_STYLE: Record<string, string> = {
  successful: "bg-green-100 text-green-700",
  pending: "bg-orange-100 text-orange-700",
  submitted: "bg-blue-100 text-blue-700",
};

const STATUS_FALLBACK = "bg-gray-100 text-gray-600";

const STATUS_LABEL: Record<string, string> = {
  successful: "Selesai",
  pending: "Tertunda",
  submitted: "Dikumpulkan",
};

type DashboardErrorState =
  | { type: "no_career_goal" }
  | { type: "not_assessed"; careerGoalId: number }
  | { type: "technical"; message: string };

function clampPercentage(value: number) {
  return Math.min(100, Math.max(0, value));
}

function formatDueDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate; // fallback kalau format tak terduga
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<DashboardErrorState | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const res = await api.get<DashboardResponse>("/dashboard");
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
            "Gagal memuat dashboard. Periksa koneksi kamu dan coba lagi.",
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (errorState?.type === "no_career_goal") {
    return (
      <StatusScreen
        icon={UserCircle}
        title="Kamu belum memilih karier tujuan"
        description="Isi dulu profil dan karier tujuanmu supaya dashboard bisa menampilkan progres belajarmu."
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
        description="Selesaikan Skill Assessment dulu supaya dashboard bisa menampilkan progres belajarmu."
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
        onRetry={fetchDashboard}
      />
    );
  }

  const firstName = data.user.name.trim().split(" ")[0] || data.user.name;
  const avatarInitial = firstName?.[0]?.toUpperCase() ?? "?";
  const progressPct = clampPercentage(data.active_learning_path.progress_percentage);

  return (
    <div className="min-h-screen bg-[#0B1739] pb-16">
      <div className="max-w-md md:max-w-5xl xl:max-w-6xl mx-auto px-5 md:px-8 pt-10">
        <h1 className="text-white text-2xl md:text-3xl xl:text-4xl font-bold mb-1">
          Hai, {firstName}!
        </h1>
        <p className="text-white/60 text-sm mb-6">
          Selamat datang kembali di dasbor pembelajaran kamu.
        </p>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={<TrendingUp className="w-4 h-4 text-blue-500" aria-hidden="true" />}
            label="Progres Keseluruhan"
            value={`${data.summary.overall_progress}%`}
            valueColor="text-blue-600"
          />
          <StatCard
            icon={<BookOpen className="w-4 h-4 text-green-500" aria-hidden="true" />}
            label="Modul Selesai"
            value={data.summary.completed_modules}
            valueColor="text-green-600"
          />
          <StatCard
            icon={<FileText className="w-4 h-4 text-orange-500" aria-hidden="true" />}
            label="Tugas Tertunda"
            value={data.summary.pending_assignments}
            valueColor="text-orange-600"
          />
          <StatCard
            icon={<Clock className="w-4 h-4 text-gray-400" aria-hidden="true" />}
            label="Sisa Minggu"
            value={data.summary.weeks_remaining}
          />
        </div>

        {/* Di desktop: kolom kiri (konten utama) + kolom kanan (info sekunder).
           Di mobile: dua div ini tetap stack berurutan seperti biasa (block layout). */}
        <div className="md:grid md:grid-cols-3 md:gap-6 md:items-start">
        <div className="md:col-span-2">

        {/* Active Learning Path */}
        <div className="bg-white rounded-2xl p-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-[#0B1739] flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" aria-hidden="true" />
              Jalur Belajar Aktif
            </h2>
            {!data.active_learning_path.locked && (
              <Link
                href="/learning-path"
                className="text-blue-600 text-sm hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                Lihat Semua
              </Link>
            )}
          </div>

          {data.active_learning_path.locked ? (
            <div className="bg-purple-50 rounded-xl p-5 text-center">
              <Sparkles className="w-5 h-5 text-purple-600 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm font-semibold text-purple-700 mb-1">
                Learning Path AI adalah fitur Pro
              </p>
              <p className="text-gray-500 text-xs mb-4">
                Upgrade untuk membuka jalur belajar personalisasi AI dan semua
                modul pembelajaran.
              </p>
              <Link
                href="/layanan"
                className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Lihat Paket Pro
              </Link>
            </div>
          ) : (
            <>
              <div className="bg-purple-50 rounded-xl p-4 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-purple-600" aria-hidden="true" />
                  <span className="text-purple-600 font-semibold text-sm">
                    Jalur Belajar Rekomendasi AI
                  </span>
                </div>
                <p className="text-gray-500 text-xs mb-3">
                  Kamu sedang mengikuti jalur belajar yang dipersonalisasi
                  berdasarkan hasil skill assessment dan kebutuhan industri.
                </p>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>
                    {data.active_learning_path.modules_completed} dari{" "}
                    {data.active_learning_path.total_modules} modul selesai
                  </span>
                  <span>{progressPct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {data.active_learning_path.modules.map((module) => (
                <Link
                  key={module.id}
                  href={`/learning-path/${module.id}`}
                  className="flex justify-between items-center border border-gray-100 rounded-xl p-3 mb-2 last:mb-0 hover:border-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <div>
                    <p className="text-sm font-medium text-[#0B1739]">
                      {module.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {module.total_lessons} pelajaran ·{" "}
                      {module.total_assignments} tugas
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
                </Link>
              ))}
            </>
          )}
        </div>

        {/* Assignments to Complete */}
        <div className="bg-white rounded-2xl p-5 mb-6">
          <h2 className="font-bold text-[#0B1739] flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-purple-600" aria-hidden="true" />
            Tugas yang Perlu Diselesaikan
          </h2>
          {data.assignments_to_complete.length === 0 && (
            <p className="text-gray-400 text-sm">
              {data.active_learning_path.locked
                ? "Upgrade ke Pro untuk melihat tugas dari learning path kamu."
                : "Tidak ada tugas tertunda. Kerja bagus!"}
            </p>
          )}
          <div className="space-y-3">
            {data.assignments_to_complete.map((a) => (
              // Dibungkus Link (sebelumnya div biasa) supaya ChevronRight di
              // kartu ini benar-benar berfungsi, bukan cuma affordance visual
              // yang menjanjikan sesuatu yang tidak terjadi saat diklik.
              // ASUMSI: field `module_id` dipakai untuk membentuk URL tujuan.
              // Sesuaikan nama field ini kalau tipe DashboardResponse kamu
              // memakai nama lain (mis. moduleId) atau kalau assignment di
              // sini idealnya menuju rute lain.
              <Link
                key={a.id}
                href={`/learning-path/${a.module_id}/assignments/${a.id}`}
                className="flex items-start gap-3 border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <div className="w-9 h-9 shrink-0 rounded-full bg-purple-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-purple-600" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-[#0B1739]">
                      {a.title}
                    </p>
                    <ChevronRight
                      className="w-4 h-4 text-gray-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{a.module_title}</p>
                  <div className="flex items-center justify-between gap-2">
                    {a.due_date ? (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        Tenggat: {formatDueDate(a.due_date)}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                        STATUS_STYLE[a.status] ?? STATUS_FALLBACK
                      }`}
                    >
                      {STATUS_LABEL[a.status] ?? a.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        </div>
        {/* end kolom kiri */}

        <div className="md:col-span-1">

        {/* Profile */}
        <div className="bg-white rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              {avatarInitial}
            </div>
            <div>
              <p className="font-medium text-[#0B1739]">{data.user.name}</p>
              <p className="text-xs text-gray-400">{data.user.email}</p>
            </div>
          </div>
          <hr className="my-3 border-gray-100" />
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Latar Belakang Pendidikan</span>
            <span className="text-[#0B1739]">
              {data.user.education_background ?? "-"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tujuan Karier</span>
            <span className="text-[#0B1739]">{data.user.career_goal}</span>
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-2xl p-5 mb-6">
          <h2 className="font-bold text-[#0B1739] mb-3">Quick Access</h2>
          <div className="space-y-2">
            <Link
              href="/skill-map"
              className="flex items-center justify-between border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-[#0B1739]">Skill Map</p>
                  <p className="text-xs text-gray-400">Lihat progresmu</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
            </Link>
            <Link
              href="/learning-path"
              className="flex items-center justify-between border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <div className="flex items-center gap-3">
                <Compass className="w-4 h-4 text-purple-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-[#0B1739]">Learning Path</p>
                  <p className="text-xs text-gray-400">Lanjutkan belajar</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Learning Tip */}
        <div className="bg-blue-600 rounded-2xl p-4 text-white text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <Lightbulb className="w-4 h-4" aria-hidden="true" />
            <span>Tips Belajar</span>
          </div>
          <p className="mt-1 text-white/90">
            Konsistensi adalah kunci! Cobalah menyelesaikan setidaknya satu
            pelajaran setiap hari untuk menjaga momentum dan mencapai
            tujuanmu lebih cepat.
          </p>
        </div>

        </div>
        {/* end kolom kanan */}

        </div>
        {/* end grid dua kolom */}

      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  valueColor = "text-[#0B1739]",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-500 text-xs">{label}</span>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0B1739] pb-16 animate-pulse">
      <div className="max-w-md md:max-w-5xl xl:max-w-6xl mx-auto px-5 md:px-8 pt-10">
        <div className="h-7 w-40 bg-white/10 rounded mb-2" />
        <div className="h-4 w-56 bg-white/10 rounded mb-6" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white/10 rounded-2xl p-4 h-20" />
          ))}
        </div>

        <div className="bg-white/10 rounded-2xl h-56 mb-6" />
        <div className="bg-white/10 rounded-2xl h-40 mb-6" />
        <div className="bg-white/10 rounded-2xl h-24 mb-6" />
        <div className="bg-white/10 rounded-2xl h-20" />
      </div>
    </div>
  );
}