"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import type { QuizAnswerResponse, QuizResponse } from "@/types/quiz";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  PartyPopper,
  ListChecks,
  Lock,
} from "lucide-react";

const SPECTRUM_GRADIENT =
  "linear-gradient(90deg, #93c5fd 0%, #60a5fa 25%, #3b82f6 50%, #2563eb 75%, #1d4ed8 100%)";

// Sama persis dengan halaman verification quiz & skill assessment: glow radial
// lembut di belakang header pada latar navy gelap, supaya seluruh alur
// quiz/assessment terasa satu pengalaman visual yang konsisten.
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

export default function QuizPage() {
  const { moduleId, assignmentId } = useParams<{
    moduleId: string;
    assignmentId: string;
  }>();
  const router = useRouter();

  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // state untuk soal yang sedang aktif (di-reset tiap pindah soal)
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<QuizAnswerResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function fetchQuiz() {
    try {
      const res = await api.get<QuizResponse>(
        `/assignments/${assignmentId}/quiz`
      );
      setQuiz(res.data);
      // lanjut dari soal pertama yang belum dijawab
      const firstUnanswered = res.data.questions.findIndex(
        (q) => q.answered_option_id == null
      );
      setCurrentIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        router.replace(`/learning-path/${moduleId}/assignments/${assignmentId}`);
        return;
      }
      setError("Gagal memuat quiz.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuiz();
  }, [assignmentId]);

  const question = quiz?.questions[currentIndex];

  // sinkronkan state jawaban tiap kali pindah soal
  useEffect(() => {
    if (!question) return;
    setSelectedOptionId(question.answered_option_id);
    if (question.answered_option_id != null) {
      setFeedback({
        is_correct: !!question.is_correct,
        correct_option_id: question.correct_option_id!,
        explanation: question.explanation,
      });
    } else {
      setFeedback(null);
    }
  }, [currentIndex, quiz]);

  async function handleSelectOption(optionId: number) {
    if (feedback || submitting) return; // sudah dijawab, gak bisa ganti

    setSelectedOptionId(optionId);
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post<QuizAnswerResponse>(
        `/quiz-questions/${question!.id}/answer`,
        { option_id: optionId }
      );
      setFeedback(res.data);
    } catch {
      setError("Gagal mengirim jawaban. Coba lagi.");
      setSelectedOptionId(null);
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (!quiz) return;
    if (currentIndex + 1 < quiz.questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      // quiz selesai — Coding Exercise nyusul, untuk sekarang balik ke detail assignment
      router.push(`/learning-path/${moduleId}/assignments/${assignmentId}`);
    }
  }

  if (loading) {
    return <QuizSkeleton />;
  }

  if (!quiz || !question) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[#0B1739] px-6 text-center">
        <GlobalStyles />
        <HeaderGlow />
        <div className="max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">{error ?? "Quiz tidak ditemukan."}</p>
        </div>
      </div>
    );
  }

  const isLastQuestion = currentIndex + 1 === quiz.total_questions;
  const progressPct = ((currentIndex + 1) / quiz.total_questions) * 100;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0B1739] pb-16">
      <GlobalStyles />
      <HeaderGlow />

      <div className="mx-auto max-w-md px-5 pt-8 md:max-w-5xl md:px-8 md:pt-10 xl:max-w-6xl">
        <div className="mb-4 flex items-center gap-3 animate-[fade-in-up_0.5s_ease-out]">
          <button
            onClick={() =>
              router.push(`/learning-path/${moduleId}/assignments/${assignmentId}`)
            }
            aria-label="Keluar dari quiz"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
          <h1 className="font-semibold text-white">Quiz Modul</h1>
        </div>

        {/* Progress ringkas: tampil di mobile & tablet. Di desktop versi lebih
            lengkap sudah ada di sidebar kanan, jadi ini disembunyikan agar tidak dobel. */}
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
              <div className="mb-5 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Soal {currentIndex + 1} dari {quiz.total_questions}
                </span>
                <span className="text-xs font-medium text-gray-400">
                  {Math.round(progressPct)}%
                </span>
              </div>

              <h2 className="mb-5 text-base font-semibold leading-relaxed text-[#0B1739] md:text-lg">
                {question.question}
              </h2>

              {/* Opsi Jawaban */}
              <div className="mb-4 space-y-2">
                {question.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  const isCorrectOpt = feedback && opt.id === feedback.correct_option_id;
                  const isWrongSelected =
                    feedback && isSelected && opt.id !== feedback.correct_option_id;

                  let optionStyle = "border-gray-200 text-gray-700 hover:bg-gray-50";
                  if (feedback) {
                    if (isCorrectOpt) {
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
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      disabled={!!feedback || submitting}
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors md:text-[15px] ${optionStyle} ${
                        feedback ? "cursor-default" : "cursor-pointer"
                      }`}
                    >
                      {opt.option_text}
                    </button>
                  );
                })}
              </div>

              {/* Hasil Per Soal (Feedback) */}
              {feedback && (
                <div
                  className={`mb-4 flex items-start gap-2 rounded-lg p-3 text-sm ${
                    feedback.is_correct ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {feedback.is_correct ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {feedback.is_correct ? "Jawaban Benar" : "Kurang Tepat"}
                    </p>
                    {feedback.explanation && (
                      <p className="mt-1 leading-relaxed">{feedback.explanation}</p>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <p role="alert" className="mb-3 text-center text-sm text-red-400">
                  {error}
                </p>
              )}

              <button
                onClick={handleNext}
                disabled={!feedback}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-600/40 disabled:shadow-none active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Memproses...
                  </>
                ) : isLastQuestion ? (
                  <>
                    <PartyPopper className="h-4 w-4" aria-hidden="true" />
                    Selesai
                  </>
                ) : (
                  <>
                    Pertanyaan Berikutnya
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Kolom kanan (desktop): progress & tips, sticky seperti verification quiz */}
          <div className="hidden lg:sticky lg:top-6 lg:col-span-1 lg:block">
            <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="mb-4 flex items-center gap-2 font-semibold text-[#0B1739]">
                <ListChecks className="h-4 w-4 text-blue-600" aria-hidden="true" />
                Progress Kuis
              </p>

              <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Soal {currentIndex + 1} dari {quiz.total_questions}
                </span>
                <span className="font-semibold text-blue-600">{Math.round(progressPct)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${progressPct}%`, background: SPECTRUM_GRADIENT }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 text-sm shadow-sm">
              <p className="mb-3 font-semibold text-[#0B1739]">Sebelum lanjut</p>
              <ul className="space-y-3 text-xs leading-relaxed text-gray-500">
                <li className="flex items-start gap-2">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" aria-hidden="true" />
                  <span>Jawaban tersimpan otomatis begitu kamu memilih dan tidak bisa diubah lagi.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" aria-hidden="true" />
                  <span>Kamu bisa lihat pembahasan singkat setelah menjawab tiap soal.</span>
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
          <div className="shimmer h-4 w-32 rounded bg-white/10" />
        </div>
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          <div className="lg:col-span-2">
            <div className="shimmer h-96 rounded-2xl bg-white/10" />
          </div>
          <div className="hidden lg:block">
            <div className="shimmer mb-5 h-32 rounded-2xl bg-white/10" />
            <div className="shimmer h-32 rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}