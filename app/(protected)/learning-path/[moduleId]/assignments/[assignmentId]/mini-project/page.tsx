"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import type { MiniProjectResponse } from "@/types/mini-project";

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
    } catch {
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
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white">
        Memuat mini project...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white/70 text-center px-6">
        {error ?? "Mini project tidak ditemukan."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1739] pb-16">
      <div className="max-w-md mx-auto px-5 pt-8">
        <button
          onClick={() =>
            router.push(`/learning-path/${moduleId}/assignments/${assignmentId}`)
          }
          className="text-white/70 text-sm mb-4"
        >
          ← Keluar dari Mini Project
        </button>

        {/* Project Brief */}
        <div className="bg-white rounded-2xl p-5 mb-4">
          <h1 className="text-lg font-bold text-[#0B1739] mb-1">
            {project.title}
          </h1>
          {project.brief && (
            <p className="text-gray-500 text-sm">{project.brief}</p>
          )}
        </div>

        {/* Objectives */}
        {project.objectives.length > 0 && (
          <div className="bg-white rounded-2xl p-5 mb-4">
            <h2 className="font-bold text-[#0B1739] mb-3">🎯 Objectives</h2>
            <ul className="space-y-2">
              {project.objectives.map((item, i) => (
                <li key={i} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-blue-600 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Acceptance Criteria */}
        {project.acceptance_criteria.length > 0 && (
          <div className="bg-white rounded-2xl p-5 mb-4">
            <h2 className="font-bold text-[#0B1739] mb-3">
              Acceptance Criteria
            </h2>
            <ul className="space-y-2">
              {project.acceptance_criteria.map((item, i) => (
                <li key={i} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-green-600 shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Deliverables */}
        {project.deliverables.length > 0 && (
          <div className="bg-white rounded-2xl p-5 mb-4">
            <h2 className="font-bold text-[#0B1739] mb-3">📦 Deliverables</h2>
            <ul className="space-y-2">
              {project.deliverables.map((item, i) => (
                <li key={i} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-blue-600 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reminder sebelum submit */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
          <p className="text-amber-800 text-sm font-medium">
            ⚠️ Periksa kembali Acceptance Criteria di atas sebelum submit.
          </p>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mb-3">{error}</p>
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
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          {submitting ? "Mengupload..." : "Lanjut ke Pengumpulan"}
        </button>
      </div>
    </div>
  );
}
