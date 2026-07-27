"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useQuizIntegrity } from "@/hooks/useQuizIntegrity";
import type {
  QuizAnswerResponse,
  QuizQuestionsResponse,
  QuizResultResponse,
  SafeQuizQuestion,
} from "@/types/self-assessment";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  ShieldAlert,
  Loader2,
  Info,
} from "lucide-react";

const SPECTRUM_GRADIENT =
  "linear-gradient(90deg, #93c5fd 0%, #60a5fa 25%, #3b82f6 50%, #2563eb 75%, #1d4ed8 100%)";

// Sama persis dengan halaman skill & self-assessment: glow radial lembut di
// belakang header pada latar navy gelap, supaya seluruh alur assessment
// terasa satu pengalaman visual yang konsisten.
function HeaderGlow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 overflow-hidden"
    >
      <div
        className="absolute left-1/2 top-[-140px] h-80 w-[560px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(closest-side, #2563eb, transparent)" }}
      />
    </div>
  );
}

function IconBadge({
  icon: Icon,
  tone = "blue",
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone?: "blue" | "green";
}) {
  const toneClass =
    tone === "green" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600";
  return (
    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
      <Icon className="h-6 w-6" aria-hidden="true" />
    </span>
  );
}

function GlobalStyles() {
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
      .shimmer { position: relative; overflow: hidden; }
      @media (prefers-reduced-motion: no-preference) {
        .shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          animation: shimmer 1.6s infinite;
        }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
      }
    `}</style>
  );
}

export default function VerificationQuizPage() {
  const { careerId } = useParams<{ careerId: string }>();
  const router = useRouter();

  const [questions, setQuestions] = useState<SafeQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<QuizAnswerResponse | null>(null);
  const [finalResult, setFinalResult] = useState<QuizResultResponse | null>(null);

  // Timer di-set 10 menit (600 detik)
  const [timeLeft, setTimeLeft] = useState(600);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  // Hook Proteksi Tab & Kuis (Hanya aktif saat user belum selesai kuis)
  const quizActive = !loading && !finalResult && !alreadyCompleted && questions.length > 0;
  useQuizIntegrity(careerId, false, quizActive);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await api.get<QuizQuestionsResponse>(
          `/careers/${careerId}/verification-quiz`
        );
        setQuestions(res.data.questions);
      } catch (error: unknown) {
        // Beri tahu TypeScript bentuk error-nya (biasanya dari Axios)
        const err = error as { response?: { status?: number } };

        // Jika status 403, berarti kuis sudah pernah dikerjakan
        if (err?.response?.status === 403) {
          setAlreadyCompleted(true);
          try {
            const resultRes = await api.get<QuizResultResponse>(
              `/careers/${careerId}/verification-quiz/result`
            );
            setFinalResult(resultRes.data);
          } catch {
            router.replace("/skill-map");
          }
        } else {
          setError("Gagal memuat quiz verification.");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [careerId, router]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Logic Timer (Hitung Mundur)
  useEffect(() => {
    if (loading || finalResult || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, finalResult, timeLeft]);

  // Logic Saat Waktu Habis (Timeout)
  useEffect(() => {
    if (timeLeft === 0 && !finalResult) {
      alert("Waktu habis! Kuis Anda akan otomatis diselesaikan.");

      // Paksa tarik hasil akhir dari backend
      api
        .get<QuizResultResponse>(`/careers/${careerId}/verification-quiz/result`)
        .then((res) => {
          setFinalResult(res.data);
        })
        .catch(() => {
          router.push("/skill-map");
        });
    }
  }, [timeLeft, finalResult, careerId, router]);

  const currentQuestion = questions[currentIndex];
  const progressPct = questions.length
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;
  const timeCritical = timeLeft <= 60;

  async function handleAnswer() {
    if (selected === null || !currentQuestion) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<QuizAnswerResponse>(
        `/verification-quiz/${currentQuestion.id}/answer`,
        { selected_option_index: selected }
      );
      setResult(res.data);
    } catch (error: unknown) {
      // Beri tahu TypeScript bentuk error-nya
      const err = error as { response?: { status?: number } };

      if (err?.response?.status === 403) {
        setError("Sesi quiz sudah diselesaikan atau ditutup. Silakan muat ulang halaman.");
      } else {
        setError("Gagal mengirim jawaban. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setResult(null);
      return;
    }

    try {
      const res = await api.get<QuizResultResponse>(
        `/careers/${careerId}/verification-quiz/result`
      );
      setFinalResult(res.data);
    } catch {
      router.push("/skill-map");
    }
  }

  if (loading) {
    return <QuizSkeleton />;
  }

  if (error && questions.length === 0 && !alreadyCompleted) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[#0B1739] px-5 text-center">
        <GlobalStyles />
        <HeaderGlow />
        <div className="max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (finalResult) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[#0B1739] px-5">
        <GlobalStyles />
        <HeaderGlow />
        <div className="w-full max-w-sm animate-[fade-in-up_0.5s_ease-out] rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            <IconBadge icon={Trophy} tone="green" />
          </div>
          <h1 className="mb-1 text-xl font-bold text-[#0B1739]">Verification Selesai!</h1>
          <p className="mb-6 text-sm text-gray-500">
            Kamu jawab benar {finalResult.correct} dari {finalResult.total_questions} soal
          </p>
          <div className="mb-2 text-4xl font-bold text-blue-600">
            {finalResult.score_percentage}%
          </div>
          <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${finalResult.score_percentage}%`, background: SPECTRUM_GRADIENT }}
            />
          </div>
          <button
            onClick={() => router.push("/skill-map")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            Lihat Skill Map
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0B1739] pb-16">
      <GlobalStyles />
      <HeaderGlow />

      <div className="mx-auto max-w-md px-5 pt-8 md:max-w-5xl md:px-8 md:pt-10 xl:max-w-6xl">
        <div className="mb-4 flex items-center gap-3 animate-[fade-in-up_0.5s_ease-out]">
          <button
            onClick={() => router.back()}
            aria-label="Kembali"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
          <h1 className="font-semibold text-white">Skill Verification</h1>
        </div>

        {/* Progress ringkas: tampil di mobile & tablet. Di desktop versi lebih
            lengkap (dengan timer besar) sudah ada di sidebar kanan, jadi ini disembunyikan agar tidak dobel. */}
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10 lg:hidden">
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${progressPct}%`, background: SPECTRUM_GRADIENT }}
          />
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">
          {/* Kolom kiri: kartu soal */}
          <div className="lg:col-span-2">
            <div className="animate-[fade-in-up_0.5s_ease-out_backwards] rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
              {/* Header Info Soal & Timer */}
              <div className="mb-6 flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm">
                <div className="text-sm font-semibold text-gray-600">
                  Soal {currentIndex + 1} / {questions.length}
                </div>

                <div
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-bold transition-colors ${
                    timeCritical
                      ? "animate-pulse bg-red-50 text-red-600"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              </div>

              <h2 className="mb-4 text-lg font-bold leading-snug text-[#0B1739]">
                {currentQuestion.question_text}
              </h2>

              {currentQuestion.code_snippet && (
                <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-green-400">
                  {currentQuestion.code_snippet}
                </pre>
              )}

              {/* Opsi Jawaban */}
              <div className="mb-4 space-y-2">
                {currentQuestion.options.map((opt, i) => {
                  const isSelected = selected === i;
                  const isCorrectOption = result && i === result.correct_option_index;
                  const isWrongSelected = result && isSelected && !result.correct;

                  let optionStyle = "border-gray-200 text-gray-700 hover:bg-gray-50";
                  if (result) {
                    if (isCorrectOption) {
                      optionStyle = "border-green-500 bg-green-50 text-green-700";
                    } else if (isWrongSelected) {
                      optionStyle = "border-red-500 bg-red-50 text-red-700";
                    } else {
                      optionStyle = "border-gray-200 text-gray-400 opacity-70";
                    }
                  } else if (isSelected) {
                    optionStyle = "border-blue-600 bg-blue-50 text-blue-700";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => !result && setSelected(i)}
                      disabled={!!result}
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${optionStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Tombol Aksi */}
              {!result && (
                <button
                  onClick={handleAnswer}
                  disabled={selected === null || submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300 disabled:shadow-none active:scale-[0.98]"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {submitting ? "Mengecek..." : "Jawab"}
                </button>
              )}

              {/* Hasil Per Soal (Feedback) */}
              {result && (
                <>
                  <div
                    className={`mb-4 flex items-start gap-2 rounded-lg p-3 text-sm ${
                      result.correct ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {result.correct ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <div>
                      <p className="font-semibold">{result.correct ? "Benar" : "Salah"}</p>
                      {result.explanation && (
                        <p className="mt-1 leading-relaxed">{result.explanation}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleNext}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1739] py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 active:scale-[0.98]"
                  >
                    {currentIndex + 1 < questions.length ? "Soal Berikutnya" : "Lihat Hasil"}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}
          </div>

          {/* Kolom kanan (desktop): progress & tips, sticky seperti step assessment lain */}
          <div className="hidden lg:sticky lg:top-6 lg:col-span-1 lg:block">
            <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="mb-4 font-semibold text-[#0B1739]">Progress Kuis</p>

              <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Soal {currentIndex + 1} dari {questions.length}
                </span>
                <span className="font-semibold text-blue-600">{Math.round(progressPct)}%</span>
              </div>
              <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${progressPct}%`, background: SPECTRUM_GRADIENT }}
                />
              </div>

              <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
                <span>Sisa waktu</span>
              </div>
              <div
                className={`flex items-center justify-center gap-2 rounded-lg py-3 text-2xl font-bold transition-colors ${
                  timeCritical ? "animate-pulse bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"
                }`}
              >
                <Clock className="h-5 w-5" aria-hidden="true" />
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 text-sm shadow-sm">
              <p className="mb-3 font-semibold text-[#0B1739]">Sebelum lanjut</p>
              <ul className="space-y-3 text-xs leading-relaxed text-gray-500">
                <li className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" aria-hidden="true" />
                  <span>Jangan pindah tab atau keluar dari halaman ini — kuis akan otomatis dianggap selesai.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" aria-hidden="true" />
                  <span>Kalau waktu habis, jawaban yang sudah kamu isi otomatis dikirim untuk dinilai.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuizSkeleton() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0B1739] pb-16">
      <GlobalStyles />
      <HeaderGlow />
      <div className="mx-auto max-w-md px-5 pt-8 md:max-w-5xl md:px-8 md:pt-10 xl:max-w-6xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="shimmer h-8 w-8 rounded-lg bg-white/10" />
          <div className="shimmer h-4 w-40 rounded bg-white/10" />
        </div>
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          <div className="lg:col-span-2">
            <div className="shimmer h-96 rounded-2xl bg-white/10" />
          </div>
          <div className="hidden lg:block">
            <div className="shimmer mb-5 h-52 rounded-2xl bg-white/10" />
            <div className="shimmer h-32 rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}