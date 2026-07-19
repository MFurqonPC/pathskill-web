"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import type {
  CodingExerciseResponse,
  CodingExerciseSubmitResponse,
} from "@/types/coding-exercise";

export default function CodingExercisePage() {
  const { moduleId, assignmentId } = useParams<{
    moduleId: string;
    assignmentId: string;
  }>();
  const router = useRouter();

  const [exercise, setExercise] = useState<CodingExerciseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sourceCode, setSourceCode] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [checkedTests, setCheckedTests] = useState<boolean[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function fetchExercise() {
    try {
      const res = await api.get<CodingExerciseResponse>(
        `/assignments/${assignmentId}/coding-exercise`
      );
      setExercise(res.data);
      // lanjutin dari kode terakhir kalau sudah pernah submit, kalau belum
      // mulai dari starter code
      setSourceCode(res.data.submitted_source_code ?? res.data.starter_code ?? "");
      setCheckedTests(new Array(res.data.test_cases.length).fill(false));
    } catch {
      setError("Gagal memuat latihan coding.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExercise();
  }, [assignmentId]);

  function handleResetCode() {
    if (!exercise) return;
    setSourceCode(exercise.starter_code ?? "");
  }

  function toggleTestChecked(index: number) {
    setCheckedTests((prev) =>
      prev.map((checked, i) => (i === index ? !checked : checked))
    );
  }

  async function handleSubmit() {
    if (!exercise || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await api.post<CodingExerciseSubmitResponse>(
        `/coding-exercises/${exercise.id}/submit`,
        { source_code: sourceCode }
      );
      setSubmitted(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ?? "Gagal mengirim kode. Coba lagi."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleBackToAssignment() {
    router.push(`/learning-path/${moduleId}/assignments/${assignmentId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white">
        Memuat latihan coding...
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white/70 text-center px-6">
        {error ?? "Latihan coding tidak ditemukan."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1739] pb-16">
      <div className="max-w-md mx-auto px-5 pt-8">
        <button
          onClick={handleBackToAssignment}
          className="text-white/70 text-sm mb-4"
        >
          ← Keluar dari Latihan Coding
        </button>

        {/* Challenge Description & Learning Objective */}
        <div className="bg-white rounded-2xl p-5 mb-4">
          <h1 className="text-lg font-bold text-[#0B1739] mb-1">
            {exercise.title}
          </h1>
          {exercise.description && (
            <p className="text-gray-500 text-sm">{exercise.description}</p>
          )}

          {exercise.learning_objectives.length > 0 && (
            <div className="mt-4">
              <h2 className="font-semibold text-[#0B1739] text-sm mb-2">
                🎯 Learning Objectives
              </h2>
              <ul className="space-y-1.5">
                {exercise.learning_objectives.map((item, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-blue-600 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Requirements */}
        {exercise.requirements.length > 0 && (
          <div className="bg-white rounded-2xl p-5 mb-4">
            <h2 className="font-bold text-[#0B1739] mb-3">Requirements</h2>
            <ul className="space-y-1.5">
              {exercise.requirements.map((item, i) => (
                <li key={i} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-blue-600 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Code Editor */}
        <div className="bg-white rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#0B1739]">Code Editor</h2>
            <span className="text-[10px] uppercase tracking-wide bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {exercise.language}
            </span>
          </div>
          <textarea
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            spellCheck={false}
            rows={12}
            className="w-full bg-[#0B1739] text-white/90 text-xs font-mono rounded-xl p-4 resize-y outline-none"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setShowHint((s) => !s)}
              className="flex-1 border border-gray-200 text-gray-600 font-medium text-sm py-2.5 rounded-xl"
            >
              {showHint ? "Sembunyikan Hint" : "💡 Hint"}
            </button>
            <button
              onClick={handleResetCode}
              className="flex-1 border border-gray-200 text-gray-600 font-medium text-sm py-2.5 rounded-xl"
            >
              Reset Code
            </button>
          </div>
          {showHint && exercise.hint && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs text-gray-600">{exercise.hint}</p>
            </div>
          )}
        </div>

        {/* Self Validation — checklist manual, bukan hasil auto-run */}
        {exercise.test_cases.length > 0 && (
          <div className="bg-white rounded-2xl p-5 mb-4">
            <h2 className="font-bold text-[#0B1739] mb-1">✅ Self Validation</h2>
            <p className="text-xs text-gray-400 mb-3">
              Belum ada auto-run — centang sendiri setelah kamu cek kodenya.
              Hasil akhir tetap direview mentor.
            </p>
            <ul className="space-y-2">
              {exercise.test_cases.map((test, i) => (
                <li key={i}>
                  <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkedTests[i] ?? false}
                      onChange={() => toggleTestChecked(i)}
                      className="mt-0.5 shrink-0"
                    />
                    <span>{test}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Live Preview — beneran di-render browser, bukan simulasi */}
        {exercise.language === "html" && (
          <div className="bg-white rounded-2xl p-5 mb-4">
            <h2 className="font-bold text-[#0B1739] mb-1">👁️ Live Preview</h2>
            <p className="text-xs text-gray-400 mb-3">
              Preview asli dari kode di atas.
            </p>
            <iframe
              srcDoc={sourceCode}
              sandbox="allow-scripts"
              title="Live Preview"
              className="w-full h-48 border border-gray-200 rounded-xl bg-white"
            />
          </div>
        )}

        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
            <p className="text-green-700 font-semibold text-sm">
              ✓ Kode berhasil dikirim untuk direview mentor.
            </p>
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center mb-3">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          {submitting ? "Mengirim..." : "Submit Solution"}
        </button>

        {submitted && (
          <button
            onClick={handleBackToAssignment}
            className="w-full mt-3 border border-white/20 text-white font-medium py-3 rounded-xl"
          >
            Lanjut →
          </button>
        )}
      </div>
    </div>
  );
}
