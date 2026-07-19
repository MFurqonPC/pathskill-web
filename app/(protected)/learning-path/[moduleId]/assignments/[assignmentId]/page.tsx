"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import type { AssignmentDetailResponse } from "@/types/assignment";

const STATUS_LABEL: Record<string, string> = {
  pending: "Belum Dikerjakan",
  submitted: "Menunggu Review",
  successful: "Selesai",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-100 text-blue-700",
  successful: "bg-green-100 text-green-700",
};

// Tahapan pengerjaan assignment. "done" dihitung dari data asli.
// Mini Project tidak punya submission tersendiri — briefnya cuma dibaca
// sekali sebelum Pengumpulan, jadi statusnya "selesai" ikut status
// pengumpulan tugas (submitted/successful), bukan flag terpisah.
function getAlurTugas(data: AssignmentDetailResponse) {
  const sudahDikumpulkan =
    data.status === "submitted" || data.status === "successful";
  return [
    { label: "Kuis", done: data.has_quiz && data.quiz_completed },
    {
      label: "Latihan Coding",
      done: data.has_coding_exercise && data.coding_exercise_completed,
    },
    { label: "Mini Project", done: data.has_mini_project && sudahDikumpulkan },
    { label: "Pengumpulan", done: sudahDikumpulkan },
    { label: "Hasil Review", done: data.status === "successful" },
  ];
}

export default function AssignmentDetailPage() {
  const { moduleId, assignmentId } = useParams<{
    moduleId: string;
    assignmentId: string;
  }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [data, setData] = useState<AssignmentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchAssignment() {
    try {
      const res = await api.get<AssignmentDetailResponse>(
        `/assignments/${assignmentId}`
      );
      setData(res.data);
    } catch {
      setError("Gagal memuat detail assignment.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  function handleStart() {
    // Alur berantai: Kuis -> Latihan Coding -> Mini Project -> Pengumpulan.
    // Assignment lama yang belum punya salah satu tahap tetap fallback ke
    // tahap berikutnya, biar gak putus alurnya sebelum semua tahap jadi.
    if (!data) return;

    if (data.has_quiz && !data.quiz_completed) {
      router.push(`/learning-path/${moduleId}/assignments/${assignmentId}/quiz`);
      return;
    }
    if (data.has_coding_exercise && !data.coding_exercise_completed) {
      router.push(
        `/learning-path/${moduleId}/assignments/${assignmentId}/coding-exercise`
      );
      return;
    }
    // Mini Project cuma ditampilkan sekali sebelum Pengumpulan pertama kali;
    // kalau lagi kirim ulang tugas (status sudah submitted), langsung ke upload.
    if (data.has_mini_project && data.status === "pending") {
      router.push(
        `/learning-path/${moduleId}/assignments/${assignmentId}/mini-project`
      );
      return;
    }
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
      // sama seperti di Module Detail: jangan set Content-Type manual,
      // biarkan axios yang menyertakan boundary multipart yang benar.
      await api.post(`/assignments/${assignmentId}/submit`, formData);
      await fetchAssignment();
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
        Memuat assignment...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white/70 text-center px-6">
        {error ?? "Assignment tidak ditemukan."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1739] pb-16">
      <div className="max-w-md mx-auto px-5 pt-8">
        <button
          onClick={() => router.push(`/learning-path/${moduleId}`)}
          className="text-white/70 text-sm mb-4"
        >
          ← Kembali ke {data.module_title}
        </button>

        {/* Header: judul + status */}
        <div className="bg-white rounded-2xl p-5 mb-4">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h1 className="text-lg font-bold text-[#0B1739]">{data.title}</h1>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLE[data.status]}`}
            >
              {STATUS_LABEL[data.status]}
            </span>
          </div>
          {data.description && (
            <p className="text-gray-500 text-sm">{data.description}</p>
          )}
        </div>

        {/* Learning Outcomes */}
        {Array.isArray(data.learning_outcomes) && data.learning_outcomes.length > 0 && (
          <div className="bg-white rounded-2xl p-5 mb-4">
            <h2 className="font-bold text-[#0B1739] mb-3">
              🎯 Learning Outcomes
            </h2>
            <ul className="space-y-2">
              {data.learning_outcomes.map((item, i) => (
                <li key={i} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-blue-600 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Skills Learned */}
        {Array.isArray(data.skills_learned) && data.skills_learned.length > 0 && (
          <div className="bg-white rounded-2xl p-5 mb-4">
            <h2 className="font-bold text-[#0B1739] mb-3">Skills Learned</h2>
            <div className="flex flex-wrap gap-2">
              {data.skills_learned.map((skill) => (
                <span
                  key={skill}
                  className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Prerequisites */}
        {Array.isArray(data.prerequisites) && data.prerequisites.length > 0 && (
          <div className="bg-white rounded-2xl p-5 mb-4">
            <h2 className="font-bold text-[#0B1739] mb-3">Prerequisites</h2>
            <div className="flex flex-wrap gap-2">
              {data.prerequisites.map((req) => (
                <span
                  key={req}
                  className="text-xs bg-[#0B1739] text-white px-3 py-1 rounded-lg font-semibold"
                >
                  {req}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tools */}
        {Array.isArray(data.tools) && data.tools.length > 0 && (
          <div className="bg-white rounded-2xl p-5 mb-4">
            <h2 className="font-bold text-[#0B1739] mb-3">Tools</h2>
            <div className="flex flex-wrap gap-2">
              {data.tools.map((tool) => (
                <span
                  key={tool}
                  className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Evaluation Rubrics */}
        {Array.isArray(data.evaluation_rubrics) && data.evaluation_rubrics.length > 0 && (
          <div className="bg-white rounded-2xl p-5 mb-4">
            <h2 className="font-bold text-[#0B1739] mb-3">
              📊 Evaluation Rubrics
            </h2>
            <ul className="space-y-2">
              {data.evaluation_rubrics.map((rubric, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">{rubric.criteria}</span>
                  <span className="text-[#0B1739] font-semibold">
                    {rubric.weight}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Alur Tugas */}
        <div className="bg-white rounded-2xl p-5 mb-4">
          <h2 className="font-bold text-[#0B1739] mb-3">Alur Tugas</h2>
          <ul className="space-y-2">
            {getAlurTugas(data).map((step) => (
              <li
                key={step.label}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                    step.done
                      ? "bg-blue-600 text-white"
                      : "border-2 border-gray-300"
                  }`}
                >
                  {step.done && "✓"}
                </span>
                <span className={step.done ? "" : "text-gray-400"}>
                  {step.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {data.file_name && (
          <a
            href={data.file_url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-300 underline block mb-3"
          >
            📎 {data.file_name}
          </a>
        )}

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
          onClick={handleStart}
          disabled={submitting || data.status === "successful"}
          className="w-full bg-[#0B1739] disabled:bg-[#0B1739]/50 text-white font-semibold py-3 rounded-xl"
        >
          {submitting
            ? "Mengupload..."
            : data.status === "successful"
              ? "Assignment Selesai"
              : data.status === "submitted"
                ? "Kirim Ulang Tugas"
                : "Mulai Tugas"}
        </button>
      </div>
    </div>
  );
}