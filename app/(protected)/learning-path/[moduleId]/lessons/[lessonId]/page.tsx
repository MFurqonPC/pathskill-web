"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Lightbulb,
  Target,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  RefreshCcw,
  HelpCircle,
  Code2,
} from "lucide-react";
import api from "@/lib/api";
import type { ModuleDetailResponse } from "@/types/learning-path";

// Setiap step punya warna & ikon sendiri supaya urutan "pahami dulu -> lihat
// contoh -> baru tau gunanya" terasa sebagai perjalanan, bukan cuma 3 tab
// yang kebetulan sebaris. Warna dipilih senada dengan bahasa visual di
// halaman detail modul (biru = materi/pemahaman, hijau = latihan/aksi).
const STEPS = [
  {
    key: "explanation",
    label: "Penjelasan",
    caption: "Pahami konsepnya",
    icon: BookOpen,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    key: "example",
    label: "Contoh",
    caption: "Lihat penerapannya",
    icon: Lightbulb,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    key: "function_context",
    label: "Fungsi",
    caption: "Kenapa ini penting",
    icon: Target,
    color: "text-green-600",
    bg: "bg-green-50",
  },
] as const;

// Badge tipe lesson, konsisten dengan LESSON_TYPE_STYLE di halaman detail
// modul. Materi utama berbentuk teks (bukan video) — tim sudah sepakat
// lesson hanya bertipe 'reading' dan 'quiz'.
const LESSON_TYPE_STYLE: Record<
  string,
  { label: string; icon: typeof BookOpen; className: string }
> = {
  text: { label: "Materi", icon: BookOpen, className: "bg-blue-50 text-blue-600" },
  reading: { label: "Materi", icon: BookOpen, className: "bg-blue-50 text-blue-600" },
  article: { label: "Materi", icon: BookOpen, className: "bg-blue-50 text-blue-600" },
  quiz: { label: "Quiz", icon: HelpCircle, className: "bg-purple-50 text-purple-600" },
  exercise: { label: "Latihan", icon: Code2, className: "bg-green-50 text-green-600" },
};

function getLessonTypeStyle(type: string) {
  return (
    LESSON_TYPE_STYLE[type] ?? {
      label: "Materi",
      icon: BookOpen,
      className: "bg-blue-50 text-blue-600",
    }
  );
}

export default function LessonReadPage() {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const router = useRouter();

  const [data, setData] = useState<ModuleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [visible, setVisible] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  function fetchLesson() {
    setLoading(true);
    setLoadError(null);
    api
      .get<ModuleDetailResponse>(`/learning-path/${moduleId}`)
      .then((res) => setData(res.data))
      .catch(() => setLoadError("Gagal memuat lesson."))
      .finally(() => setLoading(false));
  }

  const lesson = data?.lessons.find((l) => l.id === Number(lessonId));

  // Pindah step dengan sedikit crossfade, biar transisi konten terasa
  // disengaja alih-alih konten "meloncat" tiba-tiba.
  function goToStep(target: number) {
    if (target === step || target > furthestStep) return;
    setVisible(false);
    window.setTimeout(() => {
      setStep(target);
      setVisible(true);
    }, 150);
  }

  async function handleNextOrFinish() {
    const isLastStep = step === STEPS.length - 1;

    if (!isLastStep) {
      setVisible(false);
      window.setTimeout(() => {
        const next = step + 1;
        setStep(next);
        setFurthestStep((f) => Math.max(f, next));
        setVisible(true);
      }, 150);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/lessons/${lessonId}/complete`);
      router.push(`/learning-path/${moduleId}`);
    } catch {
      setSubmitError("Gagal menandai lesson selesai. Coba lagi.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LessonSkeleton />;
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex flex-col items-center justify-center gap-3 text-white/70 px-5 text-center">
        <AlertCircle className="w-6 h-6" aria-hidden="true" />
        <p>{loadError ?? "Lesson tidak ditemukan."}</p>
        <button
          onClick={fetchLesson}
          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <RefreshCcw className="w-4 h-4" aria-hidden="true" />
          Coba lagi
        </button>
      </div>
    );
  }

  const currentStep = STEPS[step];
  const content = lesson[currentStep.key];
  const isLastStep = step === STEPS.length - 1;
  const typeStyle = getLessonTypeStyle(lesson.type);
  const TypeIcon = typeStyle.icon;

  return (
    <div className="min-h-screen bg-[#0B1739] pb-16">
      <div className="max-w-md md:max-w-5xl xl:max-w-6xl mx-auto px-5 md:px-8 pt-10">
        <button
          onClick={() => router.push(`/learning-path/${moduleId}`)}
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Kembali ke Modul
        </button>

        <div className="md:grid md:grid-cols-3 md:gap-6 md:items-start">
          {/* Kolom kiri: identitas lesson + daftar step, sticky di desktop.
              Mengikuti pola sidebar sticky di halaman detail modul. */}
          <div className="md:col-span-1 md:sticky md:top-6 space-y-4 mb-4 md:mb-0">
            <div className="bg-white rounded-2xl p-5">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 ${typeStyle.className}`}
              >
                <TypeIcon className="w-3 h-3" aria-hidden="true" />
                {typeStyle.label}
              </span>
              <h1 className="text-lg md:text-xl font-bold text-[#0B1739] mb-1 leading-snug">
                {lesson.title}
              </h1>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" aria-hidden="true" />
                {lesson.duration_minutes} min
              </span>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress Lesson</span>
                  <span>
                    Langkah {step + 1} dari {STEPS.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5">
              <h2 className="font-bold text-[#0B1739] mb-3 text-sm">
                Langkah Belajar
              </h2>
              <div className="space-y-1">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const isDone = i < step;
                  const isCurrent = i === step;
                  const isReachable = i <= furthestStep;
                  return (
                    <button
                      key={s.key}
                      onClick={() => goToStep(i)}
                      disabled={!isReachable || isCurrent}
                      className={`w-full flex items-center gap-3 rounded-xl p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                        isCurrent
                          ? "bg-gray-50"
                          : isReachable
                          ? "hover:bg-gray-50"
                          : "opacity-40 cursor-not-allowed"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${
                          isDone ? "bg-green-50" : s.bg
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" aria-hidden="true" />
                        ) : (
                          <Icon className={`w-4 h-4 ${s.color}`} aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium leading-snug ${
                            isCurrent ? "text-[#0B1739]" : "text-gray-500"
                          }`}
                        >
                          {s.label}
                        </p>
                        <p className="text-xs text-gray-400 leading-snug">{s.caption}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Kolom kanan: konten step aktif */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl p-5">
              <div
                className={`transition-opacity duration-200 ${
                  visible ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${currentStep.bg}`}>
                    <currentStep.icon className={`w-4 h-4 ${currentStep.color}`} aria-hidden="true" />
                  </div>
                  <h2 className="font-bold text-[#0B1739]">{currentStep.label}</h2>
                </div>

                {content ? (
                  <p className="text-[15px] text-gray-700 whitespace-pre-line leading-relaxed text-justify max-w-[85ch]">
                    {content}
                  </p>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 rounded-xl p-4">
                    <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    Konten belum tersedia untuk bagian ini.
                  </div>
                )}
              </div>
            </div>

            {submitError && (
              <div className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3 mt-4">
                <span>{submitError}</span>
                <button
                  onClick={handleNextOrFinish}
                  className="flex items-center gap-1 text-xs font-semibold text-red-200 hover:text-white shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
                >
                  <RefreshCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  Coba lagi
                </button>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              {step > 0 && (
                <button
                  onClick={() => goToStep(step - 1)}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-white/15 text-white/80 hover:bg-white/5 hover:border-white/25 active:scale-[0.98] text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  Kembali
                </button>
              )}
              <button
                onClick={handleNextOrFinish}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#3B4A9C] hover:bg-[#333f83] disabled:bg-[#3B4A9C]/50 disabled:cursor-not-allowed active:scale-[0.99] text-white font-semibold py-3 rounded-xl shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1739]"
              >
                {submitting ? (
                  "Menyimpan..."
                ) : isLastStep ? (
                  <>
                    Selesai
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LessonSkeleton() {
  return (
    <div className="min-h-screen bg-[#0B1739] pb-16 animate-pulse">
      <div className="max-w-md md:max-w-5xl xl:max-w-6xl mx-auto px-5 md:px-8 pt-10">
        <div className="h-4 w-32 bg-white/10 rounded mb-4" />
        <div className="md:grid md:grid-cols-3 md:gap-6 md:items-start">
          <div className="md:col-span-1 space-y-4 mb-4 md:mb-0">
            <div className="bg-white/5 rounded-2xl p-5 space-y-2">
              <div className="h-4 w-16 bg-white/10 rounded-full" />
              <div className="h-5 w-4/5 bg-white/10 rounded" />
              <div className="h-3 w-16 bg-white/10 rounded" />
            </div>
            <div className="bg-white/5 rounded-2xl p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 w-full bg-white/10 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="bg-white/5 rounded-2xl p-5 space-y-3">
              <div className="h-1.5 w-full bg-white/10 rounded-full mb-2" />
              <div className="h-5 w-24 bg-white/10 rounded mb-2" />
              <div className="h-3 w-full bg-white/10 rounded" />
              <div className="h-3 w-full bg-white/10 rounded" />
              <div className="h-3 w-2/3 bg-white/10 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}