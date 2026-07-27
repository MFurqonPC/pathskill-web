"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import AssessmentStepIndicator from "@/components/AssessmentStepIndicator";
import { useQuizIntegrity } from "@/hooks/useQuizIntegrity";
import type {
  Step2ContentResponse,
  QuizAnswerResponse,
} from "@/types/self-assessment";
import {
  ListChecks,
  SlidersHorizontal,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  ArrowRight,
} from "lucide-react";

const CONFIDENCE_LABELS = ["", "Sangat Rendah", "Rendah", "Sedang", "Tinggi", "Sangat Tinggi"];

// Skala warna "skill spectrum" yang sama dengan Step 1, dipakai di slider
// confidence supaya bahasa visual (biru muda -> biru tua = makin yakin) konsisten
// di kedua halaman.
const SPECTRUM_GRADIENT =
  "linear-gradient(90deg, #93c5fd 0%, #60a5fa 25%, #3b82f6 50%, #2563eb 75%, #1d4ed8 100%)";

function confidenceColor(level: number) {
  const stops: Record<number, string> = {
    1: "#93c5fd",
    2: "#60a5fa",
    3: "#3b82f6",
    4: "#2563eb",
    5: "#1d4ed8",
  };
  return stops[level] ?? stops[3];
}

// Slider confidence dengan track & thumb yang di-styling eksplisit lewat
// pseudo-element (bukan appearance-none + accent-color, kombinasi yang bikin
// track jadi tidak kelihatan di sebagian browser). Track dasar berupa gradient
// spektrum statis (referensi skala), thumb berwarna sesuai level yang dipilih.
function ConfidenceSlider({
  level,
  onChange,
}: {
  level: number;
  onChange: (value: number) => void;
}) {
  const pct = ((level - 1) / 4) * 100;
  const labelPct = Math.min(94, Math.max(6, pct));

  return (
    <div className="relative flex h-6 items-center">
      <span
        className="pointer-events-none absolute -top-5 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold transition-all"
        style={{ left: `${labelPct}%`, color: confidenceColor(level) }}
      >
        {CONFIDENCE_LABELS[level]}
      </span>

      {/* Track dasar: gradient spektrum, selalu tampil sebagai referensi skala */}
      <div
        className="pointer-events-none absolute inset-x-0 h-1.5 rounded-full"
        style={{ background: SPECTRUM_GRADIENT }}
      />
      {/* Overlay untuk bagian yang belum tercapai, memberi kesan "progress" */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 my-auto h-1.5 rounded-r-full bg-gray-200/80"
        style={{ width: `${100 - pct}%` }}
      />

      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={level}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--thumb-color": confidenceColor(level) } as React.CSSProperties}
        className="range-thumb relative z-10 w-full cursor-pointer appearance-none bg-transparent"
        aria-valuetext={CONFIDENCE_LABELS[level]}
      />
    </div>
  );
}

// Sama persis dengan HeaderGlow di Step 1: glow radial lembut di belakang
// header pada latar navy gelap, supaya kedua step terasa satu pengalaman.
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
  size = "sm",
}: {
  icon: React.ComponentType<{ className?: string }>;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-4.5 w-4.5";
  return (
    <span
      className={`flex ${box} shrink-0 items-center justify-center rounded-lg bg-blue-50 transition-colors group-hover:bg-blue-100`}
    >
      <Icon className={`${iconSize} text-blue-600`} aria-hidden="true" />
    </span>
  );
}

// Kartu section pembungkus A/B/C, dipakai berulang agar padding, radius,
// shadow, dan animasi masuk identik dengan kartu kategori skill di Step 1.
function SectionCard({
  icon,
  title,
  badge,
  delay = 0,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge?: React.ReactNode;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="group mb-4 animate-[fade-in-up_0.5s_ease-out_backwards] rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md md:p-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h2 className="mb-4 flex items-center gap-2.5 font-bold text-[#0B1739]">
        <IconBadge icon={icon} size="sm" />
        {title}
        {badge && <span className="ml-auto text-xs font-normal text-gray-400">{badge}</span>}
      </h2>
      {children}
    </div>
  );
}

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
  const [answering, setAnswering] = useState(false);
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
    setAnswering(true);
    setError(null);
    try {
      const res = await api.post<QuizAnswerResponse>(
        `/verification-quiz/${data.warmup_question.id}/answer`,
        { selected_option_index: warmupSelected }
      );
      setWarmupResult(res.data);
    } catch {
      setError("Gagal mengirim jawaban short task.");
    } finally {
      setAnswering(false);
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

  const checklistCheckedCount = useMemo(
    () => Object.values(checklistState).filter(Boolean).length,
    [checklistState]
  );

  const avgConfidence = useMemo(() => {
    const values = Object.values(confidenceState);
    if (!values.length) return null;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [confidenceState]);

  // Satu-satunya syarat wajib untuk lanjut adalah short verification task
  // (kalau ada). Dipakai untuk progress bar & status di sidebar, senada
  // dengan progress "skill dinilai" di Step 1.
  const hasWarmup = !!data?.warmup_question;
  const gateDone = !hasWarmup || warmupResult !== null;
  const progressPct = gateDone ? 100 : 0;
  const proceedDisabled = submitting || (hasWarmup && !warmupResult);

  if (loading) {
    return <Step2Skeleton />;
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1739] px-5 text-center">
        <p className="text-white/70">{error ?? "Konten belum tersedia untuk career ini."}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0B1739] pb-28 lg:pb-16">
      <GlobalStyles />
      <HeaderGlow />

      <div className="mx-auto max-w-md px-5 pt-8 md:max-w-5xl md:px-8 md:pt-10 xl:max-w-6xl">
        <AssessmentStepIndicator currentStep={2} />

        <div className="mb-6 mt-4 animate-[fade-in-up_0.5s_ease-out]">
          <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Ready to assess your current skills?
          </h1>
          <p className="text-sm leading-relaxed text-white/60 md:max-w-lg">
            Choose how you want to self-assess: isi checklist pengalaman,
            tandai tingkat percaya diri, lalu selesaikan short verification
            task di bawah.
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">
          {/* Kolom kiri: konten self-assessment */}
          <div className="lg:col-span-2">
            {data.checklist.length > 0 && (
              <SectionCard
                icon={ListChecks}
                title="A. Experience Checklist"
                badge={`${checklistCheckedCount}/${data.checklist.length}`}
                delay={0}
              >
                <div className="divide-y divide-gray-100">
                  {data.checklist.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0 cursor-pointer"
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
                        className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
                      />
                      <span className="text-sm leading-relaxed text-gray-700">
                        {item.statement}
                      </span>
                    </label>
                  ))}
                </div>
              </SectionCard>
            )}

            {data.scenarios.length > 0 && (
              <SectionCard
                icon={SlidersHorizontal}
                title="B. Scenario-Based Confidence"
                badge={avgConfidence ? `Rata-rata: ${CONFIDENCE_LABELS[avgConfidence]}` : undefined}
                delay={80}
              >
                <div className="divide-y divide-gray-100">
                  {data.scenarios.map((scenario) => {
                    const level = confidenceState[scenario.id] ?? 3;
                    return (
                      <div key={scenario.id} className="py-4 first:pt-0 last:pb-0">
                        <p className="mb-2.5 text-sm leading-relaxed text-gray-700">
                          {scenario.scenario_text}
                        </p>
                        <div className="flex items-center gap-3 pt-4">
                          <span className="w-9 shrink-0 text-xs text-gray-400">Low</span>
                          <div className="flex-1">
                            <ConfidenceSlider
                              level={level}
                              onChange={(v) =>
                                setConfidenceState((prev) => ({ ...prev, [scenario.id]: v }))
                              }
                            />
                          </div>
                          <span className="w-9 shrink-0 text-right text-xs text-gray-400">High</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {data.warmup_question && (
              <SectionCard
                icon={ClipboardCheck}
                title="C. Short Verification Task"
                badge={
                  warmupResult
                    ? warmupResult.correct
                      ? "Correct"
                      : "Incorrect"
                    : "Belum dijawab"
                }
                delay={160}
              >
                <p className="mb-2 text-sm leading-relaxed text-gray-700">
                  {data.warmup_question.question_text}
                </p>
                {data.warmup_question.code_snippet && (
                  <pre className="mb-3 select-none overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-green-400">
                    {data.warmup_question.code_snippet}
                  </pre>
                )}
                <p className="mb-2 text-xs text-gray-500">Multiple choice:</p>
                <div className="space-y-1">
                  {data.warmup_question.options.map((opt, i) => {
                    let optionStyle = "text-gray-700";
                    let bgStyle = "";
                    if (warmupResult) {
                      if (i === warmupResult.correct_option_index) {
                        optionStyle = "text-green-700 font-medium";
                        bgStyle = "bg-green-50";
                      } else if (warmupSelected === i && !warmupResult.correct) {
                        optionStyle = "text-red-700";
                        bgStyle = "bg-red-50";
                      }
                    }

                    return (
                      <label
                        key={i}
                        className={`flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer transition-colors ${bgStyle} ${
                          !warmupResult ? "hover:bg-gray-50" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="warmup"
                          checked={warmupSelected === i}
                          onChange={() => setWarmupSelected(i)}
                          disabled={warmupResult !== null}
                          className="h-4 w-4 shrink-0 accent-blue-600"
                        />
                        <span className={`text-sm ${optionStyle}`}>{opt}</span>
                      </label>
                    );
                  })}
                </div>

                {!warmupResult && (
                  <button
                    onClick={handleWarmupSubmit}
                    disabled={warmupSelected === null || answering}
                    className="mt-3 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {answering && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                    {answering ? "Mengirim..." : "Cek Jawaban"}
                  </button>
                )}

                {warmupResult && (
                  <div
                    className={`mt-3 flex items-start gap-2 rounded-lg p-3 text-xs ${
                      warmupResult.correct
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {warmupResult.correct ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {warmupResult.correct ? "Correct" : "Incorrect"}
                      </p>
                      {warmupResult.explanation && (
                        <p className="mt-1 leading-relaxed">{warmupResult.explanation}</p>
                      )}
                    </div>
                  </div>
                )}
              </SectionCard>
            )}

            {error && (
              <p
                role="alert"
                className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}
          </div>

          {/* Kolom kanan (desktop): ringkasan status & CTA, sticky seperti Step 1 */}
          <div className="hidden lg:sticky lg:top-6 lg:col-span-1 lg:block">
            <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="mb-4 font-semibold text-[#0B1739]">Ringkasan</p>

              <ul className="mb-4 space-y-3 text-xs">
                {data.checklist.length > 0 && (
                  <li className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Experience Checklist</span>
                    <span className="font-semibold text-blue-600">
                      {checklistCheckedCount}/{data.checklist.length}
                    </span>
                  </li>
                )}
                {data.scenarios.length > 0 && (
                  <li className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Confidence rata-rata</span>
                    <span className="font-semibold text-blue-600">
                      {avgConfidence ? CONFIDENCE_LABELS[avgConfidence] : "-"}
                    </span>
                  </li>
                )}
                {data.warmup_question && (
                  <li className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Verification Task</span>
                    <span
                      className={`flex items-center gap-1 font-semibold ${
                        warmupResult
                          ? warmupResult.correct
                            ? "text-green-600"
                            : "text-red-600"
                          : "text-gray-400"
                      }`}
                    >
                      {warmupResult && (
                        warmupResult.correct ? (
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        )
                      )}
                      {warmupResult
                        ? warmupResult.correct
                          ? "Correct"
                          : "Incorrect"
                        : "Belum dijawab"}
                    </span>
                  </li>
                )}
              </ul>

              <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
                <span>Kesiapan lanjut</span>
                <span className="font-semibold text-blue-600">{progressPct}%</span>
              </div>
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${progressPct}%`, background: SPECTRUM_GRADIENT }}
                />
              </div>

              <button
                onClick={handleProceed}
                disabled={proceedDisabled}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-600/40 disabled:shadow-none active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    Proceed
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
              {hasWarmup && !warmupResult && (
                <p className="mt-2 text-center text-[11px] text-gray-400">
                  Selesaikan Short Verification Task untuk melanjutkan
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 text-sm shadow-sm">
              <p className="mb-3 font-semibold text-[#0B1739]">Kenapa ini penting?</p>
              <ul className="space-y-3 text-xs leading-relaxed text-gray-500">
                <li className="flex items-start gap-2">
                  <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" aria-hidden="true" />
                  <span>Checklist & confidence membantu AI memahami konteks pengalamanmu — opsional, isi sejujurnya.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ClipboardCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" aria-hidden="true" />
                  <span>Short Verification Task memvalidasi self-rating kamu secara objektif, jadi wajib diselesaikan sebelum lanjut.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer khusus mobile & tablet; di desktop CTA sudah ada di sidebar */}
      <div
        className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-[#0B1739]/90 p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.25)] backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-md md:max-w-5xl">
          <div className="mb-2 flex items-center justify-between text-xs text-white/60">
            <span>Kesiapan lanjut</span>
            <span className="font-semibold text-white">{progressPct}%</span>
          </div>
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${progressPct}%`, background: SPECTRUM_GRADIENT }}
            />
          </div>
          <button
            onClick={handleProceed}
            disabled={proceedDisabled}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1739] disabled:bg-blue-600/40 active:scale-[0.98]"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Menyimpan...
              </>
            ) : (
              <>
                Proceed
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Keyframes fade-in-up (identik dengan Step 1) + styling thumb slider custom.
// Thumb pakai CSS var --thumb-color yang di-set inline per elemen, supaya warnanya
// bisa dinamis mengikuti level confidence tanpa perlu class per-warna.
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

      .range-thumb {
        height: 18px;
      }
      .range-thumb::-webkit-slider-runnable-track {
        height: 6px;
        background: transparent;
      }
      .range-thumb::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        margin-top: -6px;
        border-radius: 9999px;
        background: var(--thumb-color, #3b82f6);
        border: 2px solid #ffffff;
        box-shadow: 0 1px 4px rgba(15, 23, 42, 0.35);
        cursor: pointer;
        transition: transform 0.15s ease;
      }
      .range-thumb::-webkit-slider-thumb:hover {
        transform: scale(1.1);
      }
      .range-thumb::-moz-range-track {
        height: 6px;
        background: transparent;
        border: none;
      }
      .range-thumb::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 9999px;
        background: var(--thumb-color, #3b82f6);
        border: 2px solid #ffffff;
        box-shadow: 0 1px 4px rgba(15, 23, 42, 0.35);
        cursor: pointer;
      }
      .range-thumb:focus-visible::-webkit-slider-thumb {
        outline: 2px solid var(--thumb-color, #3b82f6);
        outline-offset: 2px;
      }
      .range-thumb:focus-visible::-moz-range-thumb {
        outline: 2px solid var(--thumb-color, #3b82f6);
        outline-offset: 2px;
      }
    `}</style>
  );
}

// Skeleton loading, mengikuti struktur grid kanan-kiri yang sama dengan
// AssessmentSkeleton di Step 1 supaya tidak ada "lompatan" layout saat data masuk.
function Step2Skeleton() {
  return (
    <div className="min-h-screen bg-[#0B1739] pb-28">
      <ShimmerStyles />
      <div className="mx-auto max-w-md px-5 pt-8 md:max-w-5xl md:px-8 md:pt-10 xl:max-w-6xl">
        <div className="shimmer mb-4 h-3 w-20 rounded bg-white/10" />
        <div className="shimmer mb-6 h-2 w-full rounded bg-white/10" />
        <div className="shimmer mb-2 h-7 w-72 rounded bg-white/10" />
        <div className="shimmer mb-6 h-4 w-80 rounded bg-white/10" />

        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          <div className="lg:col-span-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shimmer mb-4 h-40 rounded-2xl bg-white/10" />
            ))}
          </div>
          <div className="hidden lg:block">
            <div className="shimmer mb-5 h-56 rounded-2xl bg-white/10" />
            <div className="shimmer h-32 rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ShimmerStyles() {
  return (
    <style>{`
      .shimmer {
        position: relative;
        overflow: hidden;
      }
      @media (prefers-reduced-motion: no-preference) {
        .shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          animation: shimmer 1.6s infinite;
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      }
    `}</style>
  );
}