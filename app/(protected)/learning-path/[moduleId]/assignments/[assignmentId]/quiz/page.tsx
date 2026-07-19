"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import type { QuizAnswerResponse, QuizResponse } from "@/types/quiz";

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
    } catch {
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
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white">
        Memuat quiz...
      </div>
    );
  }

  if (!quiz || !question) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white/70 text-center px-6">
        {error ?? "Quiz tidak ditemukan."}
      </div>
    );
  }

  const progressPct = ((currentIndex + 1) / quiz.total_questions) * 100;

  return (
    <div className="min-h-screen bg-[#0B1739] pb-16">
      <div className="max-w-md mx-auto px-5 pt-8">
        <button
          onClick={() =>
            router.push(`/learning-path/${moduleId}/assignments/${assignmentId}`)
          }
          className="text-white/70 text-sm mb-4"
        >
          ← Keluar dari Quiz
        </button>

        <div className="bg-white rounded-2xl p-5 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500">
              Question {currentIndex + 1} of {quiz.total_questions}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <p className="text-[#0B1739] font-semibold mb-4">
            {question.question}
          </p>

          <div className="space-y-2">
            {question.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              const isCorrectOpt = feedback && opt.id === feedback.correct_option_id;
              const isWrongSelected =
                feedback && isSelected && opt.id !== feedback.correct_option_id;

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  disabled={!!feedback || submitting}
                  className={`w-full text-left border rounded-xl px-4 py-3 flex items-center gap-3 text-sm transition-colors ${
                    isCorrectOpt
                      ? "border-green-500 bg-green-50 text-green-700"
                      : isWrongSelected
                      ? "border-red-400 bg-red-50 text-red-600"
                      : isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600"
                  } ${feedback ? "cursor-default" : "cursor-pointer"}`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      isSelected || isCorrectOpt
                        ? "border-current"
                        : "border-gray-300"
                    }`}
                  >
                    {(isSelected || isCorrectOpt) && (
                      <span className="w-2 h-2 rounded-full bg-current" />
                    )}
                  </span>
                  {opt.option_text}
                </button>
              );
            })}
          </div>
        </div>

        {feedback && (
          <div
            className={`rounded-2xl p-4 mb-4 ${
              feedback.is_correct
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <p
              className={`font-semibold text-sm mb-1 ${
                feedback.is_correct ? "text-green-700" : "text-red-600"
              }`}
            >
              {feedback.is_correct ? "✓ Correct" : "✗ Kurang Tepat"}
            </p>
            {feedback.explanation && (
              <p className="text-xs text-gray-600">{feedback.explanation}</p>
            )}
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center mb-3">{error}</p>
        )}

        <button
          onClick={handleNext}
          disabled={!feedback}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
          {currentIndex + 1 < quiz.total_questions ? (
            <>Pertanyaan Berikutnya <span aria-hidden>→</span></>
          ) : (
            <>✓ Selesai</>
          )}
        </button>

      </div>
    </div>
  );
}
