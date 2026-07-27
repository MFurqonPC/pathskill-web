"use client";

import { useRef, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  PartyPopper,
  HelpCircle,
  Code2,
  Paperclip,
  UploadCloud,
  RefreshCcw,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/api";
import type { ModuleDetailResponse } from "@/types/learning-path";

const STATUS_STYLE: Record<string, string> = {
  successful: "bg-green-100 text-green-700",
  pending: "bg-orange-100 text-orange-700",
  submitted: "bg-blue-100 text-blue-700",
};

const STATUS_LABEL: Record<string, string> = {
  successful: "Selesai",
  pending: "Menunggu",
  submitted: "Terkirim",
};

const STATUS_FALLBACK = "bg-gray-100 text-gray-600";

// Format tanggal ISO dari backend ("2026-07-30T00:00:00.000000Z") jadi
// bentuk singkat yang enak dibaca ("30 Jul 2026"). Fallback ke string
// aslinya kalau ternyata bukan tanggal valid, biar tidak silent-fail.
function formatDueDate(dueDate: string) {
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return dueDate;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Peta tipe lesson -> label & ikon. Materi utama berbentuk teks (bukan
// video), jadi default-nya "Materi" dengan ikon buku. Quiz/exercise
// tetap didukung untuk tipe konten lain di masa depan.
const LESSON_TYPE_STYLE: Record<
  string,
  { label: string; icon: typeof BookOpen; className: string; iconBg: string }
> = {
  text: {
    label: "Materi",
    icon: BookOpen,
    className: "bg-blue-50 text-blue-600",
    iconBg: "bg-blue-50 text-blue-600",
  },
  reading: {
    label: "Materi",
    icon: BookOpen,
    className: "bg-blue-50 text-blue-600",
    iconBg: "bg-blue-50 text-blue-600",
  },
  article: {
    label: "Materi",
    icon: BookOpen,
    className: "bg-blue-50 text-blue-600",
    iconBg: "bg-blue-50 text-blue-600",
  },
  quiz: {
    label: "Quiz",
    icon: HelpCircle,
    className: "bg-purple-50 text-purple-600",
    iconBg: "bg-purple-50 text-purple-600",
  },
  exercise: {
    label: "Latihan",
    icon: Code2,
    className: "bg-green-50 text-green-600",
    iconBg: "bg-green-50 text-green-600",
  },
};

function getLessonTypeStyle(type: string) {
  return (
    LESSON_TYPE_STYLE[type] ?? {
      label: "Materi",
      icon: BookOpen,
      className: "bg-blue-50 text-blue-600",
      iconBg: "bg-blue-50 text-blue-600",
    }
  );
}

function LessonTypeBadge({ type }: { type: string }) {
  const style = getLessonTypeStyle(type);
  const Icon = style.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${style.className}`}
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      {style.label}
    </span>
  );
}

export default function ModuleDetailPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const router = useRouter();
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const [data, setData] = useState<ModuleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchModule() {
    setLoading(true);
    setError(null);
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
      // FormData dan menyertakan boundary yang benar.
      await api.post(`/assignments/${assignmentId}/submit`, formData);
      await fetchModule();
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
          "Gagal upload file. Pastikan format pdf/doc/docx/zip/jpg/png dan ukuran maksimal 10MB."
      );
    } finally {
      setBusyId(null);
      e.target.value = "";
    }
  }

  const BackButton = () => (
    <button
      onClick={() => router.push("/learning-path")}
      className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
    >
      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
      Back to Learning Path
    </button>
  );

  if (loading) {
    return <ModuleDetailSkeleton />;
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex flex-col items-center justify-center gap-3 text-white/70 px-5 text-center">
        <p>{error ?? "Modul tidak ditemukan."}</p>
        <button
          onClick={fetchModule}
          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <RefreshCcw className="w-4 h-4" aria-hidden="true" />
          Coba lagi
        </button>
      </div>
    );
  }

  const allLessonsDone = data.lessons.every((l) => l.completed);

  return (
    <div className="min-h-screen bg-[#0B1739] pb-16">
      <div className="max-w-md md:max-w-5xl xl:max-w-6xl mx-auto px-5 md:px-8 pt-10">
        <BackButton />

        <div className="md:grid md:grid-cols-3 md:gap-6 md:items-start">
          {/* Kolom kiri: ringkasan modul, sticky di desktop */}
          <div className="md:col-span-1 md:sticky md:top-6 space-y-4 mb-4 md:mb-0">
            <div className="bg-white rounded-2xl p-5">
              <h1 className="text-xl md:text-2xl font-bold text-[#0B1739] mb-1">
                {data.title}
              </h1>
              {data.description && (
                <p className="text-gray-500 text-sm mb-3">
                  {data.description}
                </p>
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

            {data.learning_objectives && data.learning_objectives.length > 0 && (
              <div className="bg-white rounded-2xl p-5">
                <h2 className="font-bold text-[#0B1739] mb-3">
                  Learning Objectives
                </h2>
                <ul className="space-y-2.5">
                  {data.learning_objectives.map((objective, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <CheckCircle2
                        className="w-4 h-4 text-green-500 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Kolom kanan: lessons & assignments */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-5">
              <h2 className="flex items-center gap-2 font-bold text-[#0B1739] mb-3">
                <BookOpen className="w-4 h-4 text-blue-600" aria-hidden="true" />
                Lessons
              </h2>
              {/* Kartu lesson: mengikuti pola kartu "Jalur Belajar Aktif" di
                  dashboard — ikon lingkaran di kiri, border rounded-xl,
                  hover state, chevron di kanan — supaya terasa satu bahasa
                  visual dengan dashboard, bukan daftar bergaris tipis. */}
              <div className="space-y-2">
                {data.lessons.map((lesson) => {
                  const style = getLessonTypeStyle(lesson.type);
                  const Icon = style.icon;
                  return (
                    <Link
                      key={lesson.id}
                      href={`/learning-path/${moduleId}/lessons/${lesson.id}`}
                      className="flex items-center gap-3 border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                      <div
                        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${
                          lesson.completed ? "bg-green-50" : style.iconBg
                        }`}
                      >
                        {lesson.completed ? (
                          <CheckCircle2
                            className="w-4 h-4 text-green-600"
                            aria-hidden="true"
                          />
                        ) : (
                          <Icon className="w-4 h-4" aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-medium leading-snug ${
                              lesson.completed
                                ? "text-gray-400 line-through"
                                : "text-[#0B1739]"
                            }`}
                          >
                            {lesson.title}
                          </p>
                          <LessonTypeBadge type={lesson.type} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {lesson.duration_minutes} min
                        </p>
                      </div>
                      <ChevronRight
                        className="w-4 h-4 text-gray-400 shrink-0"
                        aria-hidden="true"
                      />
                    </Link>
                  );
                })}
              </div>
            </div>

            {allLessonsDone && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <p className="flex items-center justify-center gap-1.5 text-green-700 text-sm font-medium">
                  <PartyPopper className="w-4 h-4 shrink-0" aria-hidden="true" />
                  Semua materi selesai! Saatnya praktik lewat assignment di
                  bawah.
                </p>
              </div>
            )}

            {allLessonsDone && (
              <div className="bg-white rounded-2xl p-5">
                <h2 className="flex items-center gap-2 font-bold text-[#0B1739] mb-3">
                  <ClipboardList
                    className="w-4 h-4 text-purple-600"
                    aria-hidden="true"
                  />
                  Assignments
                </h2>
                {/* Kartu assignment: sama-sama mengikuti pola kartu "Tugas
                    yang Perlu Diselesaikan" di dashboard — ikon lingkaran
                    ungu, judul + badge status sejajar, tenggat di bawahnya —
                    lalu ditambah area aksi (lampiran & tombol upload) yang
                    memang khusus dibutuhkan di halaman detail ini. */}
                <div className="space-y-3">
                  {data.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-colors"
                    >
                      {/* Area info: satu Link utuh + ChevronRight, sama seperti
                          pola lessons, supaya affordance "bisa diklik, lanjut
                          ke halaman lain" konsisten. Tombol upload & lampiran
                          sengaja diletakkan DI LUAR Link ini (lihat di bawah)
                          karena elemen interaktif (button/a) tidak boleh
                          bersarang di dalam elemen interaktif lain (a). */}
                      <Link
                        href={`/learning-path/${moduleId}/assignments/${assignment.id}`}
                        className="flex items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-lg -m-1 p-1"
                      >
                        <div className="w-9 h-9 shrink-0 rounded-full bg-purple-50 flex items-center justify-center">
                          <ClipboardList
                            className="w-4 h-4 text-purple-600"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-[#0B1739]">
                              {assignment.title}
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                                  STATUS_STYLE[assignment.status] ??
                                  STATUS_FALLBACK
                                }`}
                              >
                                {STATUS_LABEL[assignment.status] ??
                                  assignment.status}
                              </span>
                              <ChevronRight
                                className="w-4 h-4 text-gray-400"
                                aria-hidden="true"
                              />
                            </div>
                          </div>

                          {assignment.description && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {assignment.description}
                            </p>
                          )}

                          {assignment.due_date && (
                            <span className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <Clock className="w-3 h-3" aria-hidden="true" />
                              Tenggat: {formatDueDate(assignment.due_date)}
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Area aksi: lampiran & upload, sejajar dengan teks judul
                          (pl-12 = lebar ikon 36px + gap 12px), di luar Link. */}
                      <div className="pl-12 mt-2">
                        {assignment.file_name && (
                          <a
                            href={assignment.file_url ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 underline flex items-center gap-1 mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded w-fit"
                          >
                            <Paperclip className="w-3 h-3" aria-hidden="true" />
                            {assignment.file_name}
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
                            busyId === assignment.id ||
                            assignment.status === "successful"
                          }
                          className="flex items-center gap-1.5 text-xs bg-blue-600 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                        >
                          <UploadCloud
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />
                          {busyId === assignment.id
                            ? "Mengupload..."
                            : assignment.file_name
                            ? "Upload Ulang"
                            : "Upload Assignment"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3 mt-4">
            <span>{error}</span>
            <button
              onClick={fetchModule}
              className="flex items-center gap-1 text-xs font-semibold text-red-200 hover:text-white shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
            >
              <RefreshCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Coba lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ModuleDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#0B1739] pb-16 animate-pulse">
      <div className="max-w-md md:max-w-5xl xl:max-w-6xl mx-auto px-5 md:px-8 pt-10">
        <div className="h-4 w-40 bg-white/10 rounded mb-4" />
        <div className="md:grid md:grid-cols-3 md:gap-6 md:items-start">
          <div className="md:col-span-1 mb-4 md:mb-0 space-y-4">
            <div className="bg-white/5 rounded-2xl p-5 space-y-3">
              <div className="h-5 w-3/4 bg-white/10 rounded" />
              <div className="h-3 w-full bg-white/10 rounded" />
              <div className="h-1.5 w-full bg-white/10 rounded-full" />
            </div>
            <div className="bg-white/5 rounded-2xl p-5 space-y-2">
              <div className="h-4 w-32 bg-white/10 rounded mb-1" />
              <div className="h-3 w-full bg-white/10 rounded" />
              <div className="h-3 w-5/6 bg-white/10 rounded" />
              <div className="h-3 w-2/3 bg-white/10 rounded" />
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="bg-white/5 rounded-2xl p-5 space-y-3">
              <div className="h-5 w-28 bg-white/10 rounded mb-2" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 w-full bg-white/10 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}