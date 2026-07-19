"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import AssessmentStepIndicator from "@/components/AssessmentStepIndicator";
import { useQuizIntegrity } from "@/hooks/useQuizIntegrity";
import type {
  Step2ContentResponse,
  QuizAnswerResponse,
} from "@/types/self-assessment";

const CONFIDENCE_LABELS = ["", "Sangat Rendah", "Rendah", "Sedang", "Tinggi", "Sangat Tinggi"];

export default function SelfAssessStep2Page() {
  const { careerId } = useParams<{ careerId: string }>();
  const router = useRouter();

  const [data, setData] = useState<Step2ContentResponse | null>(null);
  const [checklistState, setChecklistState] = useState<Record<number, boolean>>({});
  const [confidenceState, setConfidenceState] = useState<Record<number, number>>({});
  const [warmupSelected, setWarmupSelected] = useState<number | null>(null);
  const [warmupResult, setWarmupResult] = useState<QuizAnswerResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hook Proteksi: Aktif HANYA jika ada soal warmup, belum dijawab sebelumnya, dan belum di-submit di sesi ini
  const isWarmupActive = !!data?.warmup_question && !data?.warmup_completed && !warmupResult;
  useQuizIntegrity(careerId, true, isWarmupActive);

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await api.get<Step2ContentResponse>(
          `/careers/${careerId}/self-assessment`
        );
        setData(res.data);
        
        // Populasi state checklist
        setChecklistState(
          Object.fromEntries(res.data.checklist.map((c) => [c.id, c.checked]))
        );
        
        // Populasi state confidence
        setConfidenceState(
          Object.fromEntries(res.data.scenarios.map((s) => [s.id, s.confidence_level]))
        );

        // Jika warmup sudah dijawab di database, langsung set statenya
        if (res.data.warmup_completed && res.data.warmup_previous_answer) {
          setWarmupSelected(res.data.warmup_previous_answer.selected_option_index);
          setWarmupResult({
            correct: res.data.warmup_previous_answer.is_correct,
            correct_option_index: res.data.warmup_previous_answer.correct_option_index,
            explanation: res.data.warmup_previous_answer.explanation,
          });
        }
      } catch {
        setError("Gagal memuat konten self-assessment.");
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, [careerId]);

  async function handleWarmupSubmit() {
    if (warmupSelected === null || !data?.warmup_question) return;
    try {
      const res = await api.post<QuizAnswerResponse>(
        `/verification-quiz/${data.warmup_question.id}/answer`,
        { selected_option_index: warmupSelected }
      );
      setWarmupResult(res.data);
    } catch {
      setError("Gagal mengirim jawaban short task.");
    }
  }

  async function handleProceed() {
    setSubmitting(true);
    setError(null);
    try {
      if (data?.checklist.length) {
        await api.post("/self-assessment/checklist", {
          items: data.checklist.map((c) => ({
            id: c.id,
            checked: checklistState[c.id] ?? false,
          })),
        });
      }
      if (data?.scenarios.length) {
        await api.post("/self-assessment/confidence", {
          items: data.scenarios.map((s) => ({
            id: s.id,
            confidence_level: confidenceState[s.id] ?? 3,
          })),
        });
      }
      router.push(`/skill-assessment/${careerId}/verification`);
    } catch {
      setError("Gagal menyimpan. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white">
        Memuat...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white/70 text-center px-6">
        {error ?? "Konten belum tersedia untuk career ini."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1739] pb-32">
      <div className="max-w-md mx-auto px-5 pt-10">
        <p className="text-white/60 text-sm mb-1">PATHSKILL</p>
        <AssessmentStepIndicator currentStep={2} />
        <h1 className="text-white text-2xl font-bold mb-2">
          Ready to assess your current skills?
        </h1>
        <p className="text-white/70 text-sm mb-6">
          Choose how you want to self-assess:
        </p>

        {/* A. Experience Checklist */}
        {data.checklist.length > 0 && (
          <div className="bg-white rounded-2xl p-5 mb-4">
            <h2 className="font-bold text-[#0B1739] mb-3">A. Experience Checklist</h2>
            {data.checklist.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-3 py-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checklistState[item.id] ?? false}
                  onChange={(e) =>
                    setChecklistState((prev) => ({
                      ...prev,
                      [item.id]: e.target.checked,
                    }))
                  }
                  className="mt-0.5 accent-blue-600"
                />
                <span className="text-sm text-gray-700">{item.statement}</span>
              </label>
            ))}
          </div>
        )}

        {/* B. Scenario-Based Confidence */}
        {data.scenarios.length > 0 && (
          <div className="bg-white rounded-2xl p-5 mb-4">
            <h2 className="font-bold text-[#0B1739] mb-3">
              B. Scenario-Based Confidence
            </h2>
            {data.scenarios.map((scenario) => (
              <div key={scenario.id} className="mb-5 last:mb-0">
                <p className="text-sm text-gray-700 mb-1">
                  Scenario: {scenario.scenario_text}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-8">Low</span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={confidenceState[scenario.id] ?? 3}
                    onChange={(e) =>
                      setConfidenceState((prev) => ({
                        ...prev,
                        [scenario.id]: Number(e.target.value),
                      }))
                    }
                    className="flex-1 accent-blue-600"
                  />
                  <span className="text-xs text-gray-400 w-10">High</span>
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-1">
                  {CONFIDENCE_LABELS[confidenceState[scenario.id] ?? 3]}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* C. Short Verification Task */}
        {data.warmup_question && (
          <div className="bg-white rounded-2xl p-5 mb-4">
            <h2 className="font-bold text-[#0B1739] mb-3">
              C. Short Verification Task
            </h2>
            <p className="text-sm text-gray-700 mb-2">
              Question: {data.warmup_question.question_text}
            </p>
            {data.warmup_question.code_snippet && (
              <pre className="bg-gray-900 text-green-400 text-xs rounded-lg p-3 mb-3 overflow-x-auto select-none">
                {data.warmup_question.code_snippet}
              </pre>
            )}
            <p className="text-xs text-gray-500 mb-2">Multiple choice:</p>
            {data.warmup_question.options.map((opt, i) => {
              // Pewarnaan UI jika sudah dijawab
              let optionStyle = "text-gray-700";
              let bgStyle = "";
              if (warmupResult) {
                if (i === warmupResult.correct_option_index) {
                  optionStyle = "text-green-700 font-medium";
                  bgStyle = "bg-green-50 rounded px-2";
                } else if (warmupSelected === i && !warmupResult.correct) {
                  optionStyle = "text-red-700";
                  bgStyle = "bg-red-50 rounded px-2";
                }
              }

              return (
                <label
                  key={i}
                  className={`flex items-center gap-2 py-1.5 cursor-pointer ${bgStyle}`}
                >
                  <input
                    type="radio"
                    name="warmup"
                    checked={warmupSelected === i}
                    onChange={() => setWarmupSelected(i)}
                    disabled={warmupResult !== null}
                    className="accent-blue-600"
                  />
                  <span className={`text-sm ${optionStyle}`}>{opt}</span>
                </label>
              );
            })}

            {!warmupResult && (
              <button
                onClick={handleWarmupSubmit}
                disabled={warmupSelected === null}
                className="text-xs bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg mt-2"
              >
                Cek Jawaban
              </button>
            )}

            {warmupResult && (
              <div
                className={`mt-3 rounded-lg p-3 text-xs ${
                  warmupResult.correct
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                <p className="font-semibold">
                  {warmupResult.correct ? "✓ Correct" : "✗ Incorrect"}
                </p>
                {warmupResult.explanation && <p className="mt-1">{warmupResult.explanation}</p>}
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center mb-2">{error}</p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0B1739] border-t border-white/10 p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleProceed}
            disabled={submitting || (!!data?.warmup_question && !warmupResult)}
            className="w-full bg-blue-600 disabled:bg-blue-600/40 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {submitting ? "Menyimpan..." : "Proceed"}
          </button>
        </div>
      </div>
    </div>
  );
}