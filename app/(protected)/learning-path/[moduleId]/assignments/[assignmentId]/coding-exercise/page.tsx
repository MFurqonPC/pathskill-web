"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import type {
  CodingExerciseResponse,
  CodingExerciseSubmitResponse,
} from "@/types/coding-exercise";
import {
  ArrowLeft,
  ArrowRight,
  Target,
  ListTodo,
  ListChecks,
  Eye,
  Lightbulb,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Send,
} from "lucide-react";

// Sama persis dengan halaman quiz & skill assessment: glow radial lembut di
// belakang header pada latar navy gelap, supaya seluruh alur belajar terasa
// satu pengalaman visual yang konsisten.
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

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-600">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

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
      setSourceCode(res.data.submitted_source_code ?? res.data.starter_code ?? "");
      setCheckedTests(new Array(res.data.test_cases.length).fill(false));
    } catch (err: any) {
      if (err?.response?.status === 404) {
        router.replace(`/learning-path/${moduleId}/assignments/${assignmentId}`);
        return;
      }
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
    return <CodingExerciseSkeleton />;
  }

  if (!exercise) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[#0B1739] px-6 text-center">
        <GlobalStyles />
        <HeaderGlow />
        <div className="max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            {error ?? "Latihan coding tidak ditemukan."}
          </p>
        </div>
      </div>
    );
  }

  const testsCheckedCount = checkedTests.filter(Boolean).length;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0B1739] pb-16">
      <GlobalStyles />
      <HeaderGlow />

      <div className="mx-auto max-w-md px-5 pt-8 md:max-w-5xl md:px-8 md:pt-10 xl:max-w-6xl">
        <div className="mb-5 flex items-center gap-3 animate-[fade-in-up_0.5s_ease-out]">
          <button
            onClick={handleBackToAssignment}
            aria-label="Keluar dari latihan coding"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
          <h1 className="font-semibold text-white">Latihan Coding</h1>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">
          {/* Kolom kiri: code editor, live preview, submit — bagian yang paling
              sering dipakai, jadi diberi porsi lebih besar */}
          <div className="lg:col-span-2">
            {/* Judul & deskripsi tantangan — ringkas di sini, detail lengkap
                (objectives/requirements) dipindah ke sidebar kanan di desktop */}
            <div className="mb-4 animate-[fade-in-up_0.5s_ease-out_backwards] rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
              <h2 className="mb-1 text-lg font-bold text-[#0B1739] md:text-xl">
                {exercise.title}
              </h2>
              {exercise.description && (
                <p className="text-sm leading-relaxed text-gray-500">
                  {exercise.description}
                </p>
              )}

              {/* Di mobile & tablet, objectives & requirements tampil di sini
                  supaya tidak hilang (sidebar kanan hanya muncul di desktop). */}
              <div className="lg:hidden">
                {exercise.learning_objectives.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#0B1739]">
                      <Target className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                      Learning Objectives
                    </h3>
                    <BulletList items={exercise.learning_objectives} />
                  </div>
                )}
                {exercise.requirements.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#0B1739]">
                      <ListTodo className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                      Requirements
                    </h3>
                    <BulletList items={exercise.requirements} />
                  </div>
                )}
              </div>
            </div>

            {/* Code Editor */}
            <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold text-[#0B1739]">Code Editor</h2>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-700">
                  {exercise.language}
                </span>
              </div>
              <textarea
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                spellCheck={false}
                rows={14}
                className="w-full resize-y rounded-xl bg-[#0B1739] p-4 font-mono text-xs text-white/90 outline-none ring-0 transition-shadow focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setShowHint((s) => !s)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  {showHint ? "Sembunyikan Hint" : "Hint"}
                </button>
                <button
                  onClick={handleResetCode}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Reset Code
                </button>
              </div>
              {showHint && exercise.hint && (
                <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs leading-relaxed text-gray-600">{exercise.hint}</p>
                </div>
              )}
            </div>

            {/* Self Validation — checklist manual, bukan hasil auto-run */}
            {exercise.test_cases.length > 0 && (
              <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="flex items-center gap-1.5 font-bold text-[#0B1739]">
                    <ListChecks className="h-4 w-4 text-blue-600" aria-hidden="true" />
                    Self Validation
                  </h2>
                  <span className="text-xs font-medium text-gray-400">
                    {testsCheckedCount}/{exercise.test_cases.length}
                  </span>
                </div>
                <p className="mb-3 text-xs text-gray-400">
                  Belum ada auto-run — centang sendiri setelah kamu cek kodenya.
                  Hasil akhir tetap direview mentor.
                </p>
                <ul className="space-y-2">
                  {exercise.test_cases.map((test, i) => (
                    <li key={i}>
                      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg p-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={checkedTests[i] ?? false}
                          onChange={() => toggleTestChecked(i)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
                        />
                        <span className={checkedTests[i] ? "text-gray-400 line-through" : ""}>
                          {test}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Live Preview — beneran di-render browser, bukan simulasi */}
            {exercise.language === "html" && (
              <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                <h2 className="mb-1 flex items-center gap-1.5 font-bold text-[#0B1739]">
                  <Eye className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  Live Preview
                </h2>
                <p className="mb-3 text-xs text-gray-400">
                  Preview asli dari kode di atas.
                </p>
                <iframe
                  srcDoc={sourceCode}
                  sandbox="allow-scripts"
                  title="Live Preview"
                  className="h-48 w-full rounded-xl border border-gray-200 bg-white"
                />
              </div>
            )}

            {submitted && (
              <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-green-200 bg-green-50 p-4">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-green-600" aria-hidden="true" />
                <p className="text-sm font-semibold text-green-700">
                  Kode berhasil dikirim untuk direview mentor.
                </p>
              </div>
            )}

            {error && (
              <p role="alert" className="mb-3 text-center text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-600/40 disabled:shadow-none active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Submit Solution
                </>
              )}
            </button>

            {submitted && (
              <button
                onClick={handleBackToAssignment}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 py-3 font-medium text-white transition-colors hover:bg-white/5"
              >
                Lanjut
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          {/* end kolom kiri */}

          {/* Kolom kanan (desktop): objectives & requirements, sticky seperti
              halaman quiz & skill assessment */}
          <div className="hidden lg:sticky lg:top-6 lg:col-span-1 lg:block">
            {exercise.learning_objectives.length > 0 && (
              <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#0B1739]">
                  <Target className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  Learning Objectives
                </h3>
                <BulletList items={exercise.learning_objectives} />
              </div>
            )}

            {exercise.requirements.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#0B1739]">
                  <ListTodo className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  Requirements
                </h3>
                <BulletList items={exercise.requirements} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CodingExerciseSkeleton() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0B1739] pb-16">
      <GlobalStyles />
      <HeaderGlow />
      <div className="mx-auto max-w-md px-5 pt-8 md:max-w-5xl md:px-8 md:pt-10 xl:max-w-6xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="shimmer h-8 w-8 rounded-lg bg-white/10" />
          <div className="shimmer h-4 w-36 rounded bg-white/10" />
        </div>
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          <div className="lg:col-span-2">
            <div className="shimmer mb-4 h-24 rounded-2xl bg-white/10" />
            <div className="shimmer mb-4 h-72 rounded-2xl bg-white/10" />
            <div className="shimmer h-12 rounded-xl bg-white/10" />
          </div>
          <div className="hidden lg:block">
            <div className="shimmer mb-5 h-40 rounded-2xl bg-white/10" />
            <div className="shimmer h-40 rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}