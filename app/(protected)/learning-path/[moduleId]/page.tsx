"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import type { ModuleDetailResponse } from "@/types/learning-path";

const STATUS_STYLE: Record<string, string> = {
  successful: "bg-green-100 text-green-700",
  pending: "bg-orange-100 text-orange-700",
  submitted: "bg-blue-100 text-blue-700",
};

export default function ModuleDetailPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const router = useRouter();
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const [data, setData] = useState<ModuleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchModule() {
    try {
      const res = await api.get<ModuleDetailResponse>(
        `/learning-path/${moduleId}`
      );
      setData(res.data);
    } catch {
      setError("Gagal memuat detail modul.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchModule();
  }, [moduleId]);

  async function handleCompleteLesson(lessonId: number, alreadyCompleted: boolean) {
    if (alreadyCompleted) return; // sudah selesai, nggak perlu request ulang
    setBusyId(lessonId);
    setError(null);
    try {
      await api.post(`/lessons/${lessonId}/complete`);
      await fetchModule();
    } catch {
      setError("Gagal update progress lesson.");
    } finally {
      setBusyId(null);
    }
  }

  function triggerFilePicker(assignmentId: number) {
    fileInputRefs.current[assignmentId]?.click();
  }

  async function handleFileSelected(
    assignmentId: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusyId(assignmentId);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      // JANGAN set Content-Type manual di sini — axios otomatis mendeteksi
      // FormData dan menyertakan boundary yang benar. Kalau di-override manual
      // jadi "multipart/form-data" tanpa boundary, request gagal di-parse backend.
      await api.post(`/assignments/${assignmentId}/submit`, formData);
      await fetchModule();
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
          "Gagal upload file. Pastikan format pdf/doc/docx/zip/jpg/png dan ukuran maksimal 10MB."
      );
    } finally {
      setBusyId(null);
      e.target.value = ""; // reset input biar bisa pilih file sama lagi kalau perlu resubmit
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white">
        Memuat modul...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white/70">
        {error ?? "Modul tidak ditemukan."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1739] pb-16">
      <div className="max-w-md mx-auto px-5 pt-8">
        <button
          onClick={() => router.push("/learning-path")}
          className="text-white/70 text-sm mb-4"
        >
          ← Back to Learning Path
        </button>

        <div className="bg-white rounded-2xl p-5 mb-4">
          <h1 className="text-xl font-bold text-[#0B1739] mb-1">
            {data.title}
          </h1>
          {data.description && (
            <p className="text-gray-500 text-sm mb-3">{data.description}</p>
          )}
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Module Progress</span>
            <span>{data.progress_percentage}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${data.progress_percentage}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 mb-4">
          <h2 className="font-bold text-[#0B1739] mb-3">📖 Lessons</h2>
          {data.lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCompleteLesson(lesson.id, lesson.completed)}
                  disabled={busyId === lesson.id}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    lesson.completed
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300"
                  }`}
                  aria-label={lesson.completed ? "Selesai" : "Tandai selesai"}
                >
                  {lesson.completed && "✓"}
                </button>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      lesson.completed
                        ? "text-gray-400 line-through"
                        : "text-[#0B1739]"
                    }`}
                  >
                    {lesson.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {lesson.duration_minutes} min · {lesson.type}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-5 mb-4">
          <h2 className="font-bold text-[#0B1739] mb-3">📝 Assignments</h2>
          {data.assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="border-b border-gray-100 py-3 last:border-0"
            >
              <div className="flex justify-between items-start mb-1">
                <Link
                  href={`/learning-path/${moduleId}/assignments/${assignment.id}`}
                  className="text-sm font-medium text-[#0B1739] hover:underline"
                >
                  {assignment.title}
                </Link>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${STATUS_STYLE[assignment.status]}`}
                >
                  {assignment.status}
                </span>
              </div>
              {assignment.description && (
                <p className="text-xs text-gray-400 mb-1">
                  {assignment.description}
                </p>
              )}
              {assignment.due_date && (
                <p className="text-xs text-gray-400 mb-2">
                  Due: {assignment.due_date}
                </p>
              )}

              {assignment.file_name && (
                <a
                  href={assignment.file_url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline block mb-2"
                >
                  📎 {assignment.file_name}
                </a>
              )}

              <input
                type="file"
                accept=".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png"
                className="hidden"
                ref={(el) => {
                  fileInputRefs.current[assignment.id] = el;
                }}
                onChange={(e) => handleFileSelected(assignment.id, e)}
              />
              <button
                onClick={() => triggerFilePicker(assignment.id)}
                disabled={
                  busyId === assignment.id || assignment.status === "successful"
                }
                className="text-xs bg-blue-600 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-lg"
              >
                {busyId === assignment.id
                  ? "Mengupload..."
                  : assignment.file_name
                  ? "⬆ Upload Ulang"
                  : "⬆ Upload Assignment"}
              </button>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </div>
    </div>
  );
}