"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import type { MiniProjectResponse } from "@/types/mini-project";
import {
  ArrowLeft,
  Target,
  CheckCircle2,
  Package,
  AlertTriangle,
  UploadCloud,
  Loader2,
} from "lucide-react";

// Sama persis dengan halaman quiz, coding exercise & skill assessment: glow
// radial lembut di belakang header pada latar navy gelap, supaya seluruh alur
// belajar terasa satu pengalaman visual yang konsisten.
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

function DotList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-600">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function MiniProjectPage() {
  const { moduleId, assignmentId } = useParams<{
    moduleId: string;
    assignmentId: string;
  }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [project, setProject] = useState<MiniProjectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchMiniProject() {
    try {
      const res = await api.get<MiniProjectResponse>(
        `/assignments/${assignmentId}/mini-project`
      );
      setProject(res.data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        router.replace(`/learning-path/${moduleId}/assignments/${assignmentId}`);
        return;
      }
      setError("Gagal memuat mini project.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMiniProject();
  }, [assignmentId]);

  function handleLanjutPengumpulan() {
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      // sama seperti di Assignment Detail: jangan set Content-Type manual,
      // biarkan axios yang menyertakan boundary multipart yang benar.
      await api.post(`/assignments/${assignmentId}/submit`, formData);
      router.push(`/learning-path/${moduleId}/assignments/${assignmentId}`);
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
          "Gagal upload file. Pastikan format pdf/doc/docx/zip/jpg/png dan ukuran maksimal 10MB."
      );
    } finally {
      setSubmitting(false);
      e.target.value = "";
    }
  }

  if (loading) {
    return <MiniProjectSkeleton />;
  }

  if (!project) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[#0B1739] px-6 text-center">
        <GlobalStyles />
        <HeaderGlow />
        <div className="max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            {error ?? "Mini project tidak ditemukan."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0B1739] pb-16">
      <GlobalStyles />
      <HeaderGlow />

      <div className="mx-auto max-w-md px-5 pt-8 md:max-w-5xl md:px-8 md:pt-10 xl:max-w-6xl">
        <div className="mb-5 flex items-center gap-3 animate-[fade-in-up_0.5s_ease-out]">
          <button
            onClick={() =>
              router.push(`/learning-path/${moduleId}/assignments/${assignmentId}`)
            }
            aria-label="Keluar dari mini project"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
          <h1 className="font-semibold text-white">Mini Project</h1>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">
          {/* Kolom kiri: brief, acceptance criteria, reminder, dan aksi submit —
              bagian yang paling menentukan sebelum mengumpulkan tugas */}
          <div className="lg:col-span-2">
            {/* Project Brief */}
            <div className="mb-4 animate-[fade-in-up_0.5s_ease-out_backwards] rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
              <h2 className="mb-1 text-lg font-bold text-[#0B1739] md:text-xl">
                {project.title}
              </h2>
              {project.brief && (
                <p className="text-sm leading-relaxed text-gray-500">{project.brief}</p>
              )}

              {/* Di mobile & tablet, Objectives & Deliverables tampil di sini
                  supaya tidak hilang (sidebar kanan hanya muncul di desktop). */}
              <div className="lg:hidden">
                {project.objectives.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#0B1739]">
                      <Target className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                      Objectives
                    </h3>
                    <DotList items={project.objectives} />
                  </div>
                )}
                {project.deliverables.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#0B1739]">
                      <Package className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                      Deliverables
                    </h3>
                    <DotList items={project.deliverables} />
                  </div>
                )}
              </div>
            </div>

            {/* Acceptance Criteria */}
            {project.acceptance_criteria.length > 0 && (
              <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                <h2 className="mb-3 flex items-center gap-1.5 font-bold text-[#0B1739]">
                  <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                  Acceptance Criteria
                </h2>
                <ul className="space-y-2.5">
                  {project.acceptance_criteria.map((item, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-gray-600">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reminder sebelum submit */}
            <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
              <p className="text-sm font-medium text-amber-800">
                Periksa kembali Acceptance Criteria di atas sebelum submit.
              </p>
            </div>

            {error && (
              <p role="alert" className="mb-3 text-center text-sm text-red-400">
                {error}
              </p>
            )}

            <input
              type="file"
              accept=".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelected}
            />
            <button
              onClick={handleLanjutPengumpulan}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-600/40 disabled:shadow-none active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Mengupload...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" aria-hidden="true" />
                  Lanjut ke Pengumpulan
                </>
              )}
            </button>
            <p className="mt-2 text-center text-xs text-white/40">
              Format: pdf, doc, docx, zip, jpg, png · Maks. 10MB
            </p>
          </div>
          {/* end kolom kiri */}

          {/* Kolom kanan (desktop): objectives & deliverables, sticky seperti
              halaman quiz & coding exercise */}
          <div className="hidden lg:sticky lg:top-6 lg:col-span-1 lg:block">
            {project.objectives.length > 0 && (
              <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#0B1739]">
                  <Target className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  Objectives
                </h3>
                <DotList items={project.objectives} />
              </div>
            )}

            {project.deliverables.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#0B1739]">
                  <Package className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  Deliverables
                </h3>
                <DotList items={project.deliverables} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniProjectSkeleton() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0B1739] pb-16">
      <GlobalStyles />
      <HeaderGlow />
      <div className="mx-auto max-w-md px-5 pt-8 md:max-w-5xl md:px-8 md:pt-10 xl:max-w-6xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="shimmer h-8 w-8 rounded-lg bg-white/10" />
          <div className="shimmer h-4 w-32 rounded bg-white/10" />
        </div>
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          <div className="lg:col-span-2">
            <div className="shimmer mb-4 h-28 rounded-2xl bg-white/10" />
            <div className="shimmer mb-4 h-40 rounded-2xl bg-white/10" />
            <div className="shimmer mb-4 h-16 rounded-2xl bg-white/10" />
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