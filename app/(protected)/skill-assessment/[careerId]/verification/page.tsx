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
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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
      api.get<QuizResultResponse>(`/careers/${careerId}/verification-quiz/result`)
        .then((res) => {
          setFinalResult(res.data);
        })
        .catch(() => {
          router.push("/skill-map");
        });
    }
  }, [timeLeft, finalResult, careerId, router]);

  const currentQuestion = questions[currentIndex];

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
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white">
        Memuat quiz...
      </div>
    );
  }

  if (error && questions.length === 0 && !alreadyCompleted) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white/70 text-center px-6">
        {error}
      </div>
    );
  }

  if (finalResult) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center px-5">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h1 className="text-xl font-bold text-[#0B1739] mb-1">
            Verification Selesai!
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Kamu jawab benar {finalResult.correct} dari {finalResult.total_questions} soal
          </p>
          <div className="text-4xl font-bold text-blue-600 mb-6">
            {finalResult.score_percentage}%
          </div>
          <button
            onClick={() => router.push("/skill-map")}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl"
          >
            Lihat Skill Map →
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-[#0B1739] pb-10">
      <div className="max-w-md mx-auto px-5 pt-8">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="text-white/70 text-lg"
            aria-label="Kembali"
          >
            ←
          </button>
          <h1 className="text-white font-semibold">Skill Verification</h1>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/10 rounded-full h-1.5 mb-6">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>

        {/* Container Soal */}
        <div className="bg-white rounded-2xl p-5">
          {/* Header Info Soal & Timer */}
          <div className="flex justify-between items-center mb-6 px-4 py-3 bg-white shadow-sm rounded-lg border border-gray-100">
            <div className="text-sm font-semibold text-gray-600">
              Soal {currentIndex + 1} / {questions.length}
            </div>

            <div className={`flex items-center gap-2 px-3 py-1 rounded-md font-bold text-lg transition-colors ${
              timeLeft <= 60
                ? 'bg-red-50 text-red-600 animate-pulse'
                : 'bg-blue-50 text-blue-700'
            }`}>
              <span>⏳</span>
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          <h2 className="font-bold text-[#0B1739] text-lg mb-4">
            {currentQuestion.question_text}
          </h2>

          {currentQuestion.code_snippet && (
            <pre className="bg-gray-900 text-green-400 text-xs rounded-lg p-3 mb-4 overflow-x-auto">
              {currentQuestion.code_snippet}
            </pre>
          )}

          {/* Opsi Jawaban */}
          <div className="space-y-2 mb-4">
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
                  className={`w-full text-left border rounded-xl px-4 py-3 text-sm transition-colors ${optionStyle}`}
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
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {submitting ? "Mengecek..." : "Jawab"}
            </button>
          )}

          {/* Hasil Per Soal (Feedback) */}
          {result && (
            <>
              <div
                className={`rounded-lg p-3 text-sm mb-4 ${
                  result.correct
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                <p className="font-semibold mb-1">
                  {result.correct ? "✓ Benar" : "✗ Salah"}
                </p>
                {result.explanation && <p className="mt-1 leading-relaxed">{result.explanation}</p>}
              </div>
              <button
                onClick={handleNext}
                className="w-full bg-[#0B1739] hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {currentIndex + 1 < questions.length ? "Soal Berikutnya →" : "Lihat Hasil →"}
              </button>
            </>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}