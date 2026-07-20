"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import type { ModuleDetailResponse } from "@/types/learning-path";

const STEPS = [
  { key: "explanation", label: "📘 Penjelasan" },
  { key: "example", label: "💡 Contoh" },
  { key: "function_context", label: "🎯 Fungsi" },
] as const;

export default function LessonReadPage() {
  const { moduleId, lessonId } = useParams<{ moduleId: string; lessonId: string }>();
  const router = useRouter();

  const [data, setData] = useState<ModuleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ModuleDetailResponse>(`/learning-path/${moduleId}`)
      .then((res) => {
        console.log("DATA:", res.data);
        setData(res.data);
      })
      .catch(() => setError("Gagal memuat lesson."))
      .finally(() => setLoading(false));
  }, [moduleId]);

  const lesson = data?.lessons.find((l) => l.id === Number(lessonId));

  async function handleNextOrFinish() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/lessons/${lessonId}/complete`);
      router.push(`/learning-path/${moduleId}`);
    } catch {
      setError("Gagal menandai lesson selesai. Coba lagi.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white">
        Memuat lesson...
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white/70">
        {error ?? "Lesson tidak ditemukan."}
      </div>
    );
  }

  const currentStep = STEPS[step];
  const content = lesson[currentStep.key];
  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-[#0B1739] pb-16">
      <div className="max-w-md mx-auto px-5 pt-8">
        <button
          onClick={() => router.push(`/learning-path/${moduleId}`)}
          className="text-white/70 text-sm mb-4"
        >
          ← Kembali ke Modul
        </button>

        <div className="bg-white rounded-2xl p-5 mb-4">
          <h1 className="text-lg font-bold text-[#0B1739] mb-1">{lesson.title}</h1>
          <p className="text-xs text-gray-400 mb-4">
            {lesson.duration_minutes} min · {lesson.type}
          </p>

          <div className="flex gap-2 mb-4">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={`h-1 flex-1 rounded-full ${
                  i <= step ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          <h2 className="font-semibold text-[#0B1739] mb-2">{currentStep.label}</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
            {content || "Konten belum tersedia."}
          </p>
        </div>

        {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}

        <button
          onClick={handleNextOrFinish}
          disabled={submitting}
          className="w-full bg-[#3B4A9C] disabled:bg-[#3B4A9C]/50 text-white font-semibold py-3 rounded-xl"
        >
          {submitting ? "Menyimpan..." : isLastStep ? "Selesai →" : "Next →"}
        </button>
      </div>
    </div>
  );
}