"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Target,
  Sparkles,
  Layers,
  Wrench,
  BarChart3,
  ListTodo,
  CheckCircle2,
  Circle,
  Paperclip,
  UploadCloud,
  RefreshCcw,
  Clock,
  Info,
} from "lucide-react";
import api from "@/lib/api";
import type { AssignmentDetailResponse } from "@/types/assignment";
import { useAssignmentUpload } from "@/hooks/useAssignmentUpload";
import { formatDueDate, getDueDateUrgency } from "@/lib/date";

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

// Fallback kalau backend kirim status yang belum dipetakan — samakan
// dengan pola di ModuleDetailPage, biar badge tidak kehilangan style-nya.
const STATUS_FALLBACK = "bg-gray-100 text-gray-600";

const DUE_DATE_STYLE: Record<string, string> = {
  overdue: "text-red-500 font-medium",
  urgent: "text-orange-500 font-medium",
  normal: "text-gray-400",
  none: "text-gray-400",
};

type AlurStep = {
  label: string;
  done: boolean;
};

// Tahapan pengerjaan assignment. "done" dihitung dari data asli.
// Mini Project tidak punya submission tersendiri — briefnya cuma dibaca
// sekali sebelum Pengumpulan, jadi statusnya "selesai" ikut status
// pengumpulan tugas (submitted/successful), bukan flag terpisah.
function getAlurTugas(data: AssignmentDetailResponse): AlurStep[] {
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

// Index step yang sedang aktif = step pertama yang belum "done".
// Kalau semua sudah done, tidak ada step aktif (-1).
function getCurrentStepIndex(steps: AlurStep[]) {
  return steps.findIndex((s) => !s.done);
}

// Ukuran file maksimum untuk upload tugas (10MB). Validasi ulang di client
// walaupun `accept` sudah difilter di dialog file — user tetap bisa lolos
// filter itu lewat drag-and-drop atau override manual.
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export default function AssignmentDetailPage() {
  const { moduleId, assignmentId } = useParams<{
    moduleId: string;
    assignmentId: string;
  }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [data, setData] = useState<AssignmentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // File yang sudah dipilih tapi menunggu konfirmasi user, khusus untuk
  // kasus kirim ulang tugas (submission lama akan tertimpa).
  const [pendingResubmitFile, setPendingResubmitFile] = useState<File | null>(
    null,
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  async function fetchAssignment() {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await api.get<AssignmentDetailResponse>(
        `/assignments/${assignmentId}`,
      );
      setData(res.data);
    } catch (err) {
      // Bedakan 404 dari error lain supaya pesannya lebih membantu user,
      // sambil tetap log detailnya untuk debugging.
      console.error("Gagal memuat assignment:", err);
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      setFetchError(
        status === 404
          ? "Assignment tidak ditemukan."
          : "Gagal memuat detail assignment. Periksa koneksi internetmu.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  // Upload logic dipusatkan di shared hook — format file & pesan error
  // sama persis dengan yang dipakai ModuleDetailPage.
  const {
    upload,
    isUploading,
    error: uploadError,
    setError: setUploadError,
    acceptedFileTypes,
  } = useAssignmentUpload(fetchAssignment);

  const submitting = isUploading(assignmentId);
  const error = fetchError ?? uploadError ?? validationError;

  function handleStart() {
    // Alur berantai: Kuis -> Latihan Coding -> Mini Project -> Pengumpulan.
    // Assignment lama yang belum punya salah satu tahap tetap fallback ke
    // tahap berikutnya, biar gak putus alurnya sebelum semua tahap jadi.
    if (!data) return;

    if (data.has_quiz && !data.quiz_completed) {
      router.push(
        `/learning-path/${moduleId}/assignments/${assignmentId}/quiz`,
      );
      return;
    }
    if (data.has_coding_exercise && !data.coding_exercise_completed) {
      router.push(
        `/learning-path/${moduleId}/assignments/${assignmentId}/coding-exercise`,
      );
      return;
    }
    // Mini Project cuma ditampilkan sekali sebelum Pengumpulan pertama kali;
    // kalau lagi kirim ulang tugas (status sudah submitted), langsung ke upload.
    if (data.has_mini_project && data.status === "pending") {
      router.push(
        `/learning-path/${moduleId}/assignments/${assignmentId}/mini-project`,
      );
      return;
    }
    fileInputRef.current?.click();
  }

  // Navigasi ke halaman Hasil Review — dipanggil dari actionCard, sticky
  // CTA mobile ketika assignment sudah selesai direview (isDone), dan dari
  // step "Hasil Review" di Alur Tugas begitu tugas sudah dikumpulkan
  // (submitted/successful). Halaman /review sendiri sudah menangani kondisi
  // "belum direview" dengan pesan yang jelas, jadi aman diakses lebih awal.
  function handleLihatHasilReview() {
    router.push(
      `/learning-path/${moduleId}/assignments/${assignmentId}/review`,
    );
  }

  function validateFile(file: File): string | null {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return "Ukuran file maksimal 10MB.";
    }
    return null;
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !data) return;

    setValidationError(null);
    const validationMessage = validateFile(file);
    if (validationMessage) {
      setValidationError(validationMessage);
      return;
    }

    // Kirim ulang tugas akan menimpa submission sebelumnya — minta
    // konfirmasi eksplisit dulu sebelum benar-benar upload.
    if (data.status === "submitted") {
      setPendingResubmitFile(file);
      return;
    }

    await upload(assignmentId, file);
  }

  async function confirmResubmit() {
    if (!pendingResubmitFile) return;
    await upload(assignmentId, pendingResubmitFile);
    setPendingResubmitFile(null);
  }

  if (loading) {
    return <AssignmentDetailSkeleton />;
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex flex-col items-center justify-center gap-3 text-white/70 px-5 text-center">
        <p>{fetchError ?? "Assignment tidak ditemukan."}</p>
        <button
          onClick={fetchAssignment}
          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <RefreshCcw className="w-4 h-4" aria-hidden="true" />
          Coba lagi
        </button>
      </div>
    );
  }

  const alurTugas = getAlurTugas(data);
  const currentStepIndex = getCurrentStepIndex(alurTugas);
  const currentStepLabel =
    currentStepIndex >= 0 ? alurTugas[currentStepIndex].label : null;

  const dueUrgency = getDueDateUrgency(data.due_date);
  const hasExtraContent =
    (data.learning_outcomes?.length ?? 0) > 0 ||
    (data.skills_learned?.length ?? 0) > 0 ||
    (data.prerequisites?.length ?? 0) > 0 ||
    (data.tools?.length ?? 0) > 0 ||
    (data.evaluation_rubrics?.length ?? 0) > 0;

  const isDone = data.status === "successful";
  // Halaman /review sudah didesain menangani kondisi "belum direview"
  // (data.review === null) dengan pesan yang jelas, jadi step ini boleh
  // dibuka begitu tugas sudah dikumpulkan — tidak perlu menunggu mentor
  // selesai menilai (status "successful") dulu.
  const canViewReview = data.status === "submitted" || isDone;

  // Kartu aksi (lampiran + tombol utama). Diekstrak jadi variabel supaya
  // bisa ditempatkan di posisi berbeda tergantung ada/tidaknya extra
  // content, tanpa duplikasi markup.
  //
  // PENTING: dibungkus "hidden md:block" — di mobile, tombol aksi HANYA
  // muncul lewat sticky footer di bawah (lihat render-nya di akhir file).
  // Ini disengaja, bukan berdasarkan hasExtraContent: dua elemen ini harus
  // saling eksklusif lewat breakpoint layar, bukan lewat kondisi data —
  // supaya tidak ada skenario apa pun (data assignment apa pun) yang bisa
  // membuat keduanya tampil bersamaan seperti bug sebelumnya.
  const actionCard = (
    <div className="hidden md:block bg-white rounded-2xl p-5">
      {data.file_name && data.file_url && (
        <a
          href={data.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 underline flex items-center gap-1.5 mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded w-fit"
        >
          <Paperclip className="w-3.5 h-3.5" aria-hidden="true" />
          {data.file_name}
        </a>
      )}
      {data.file_name && !data.file_url && (
        <span className="text-sm text-gray-400 flex items-center gap-1.5 mb-3 w-fit">
          <Paperclip className="w-3.5 h-3.5" aria-hidden="true" />
          {data.file_name} (tautan tidak tersedia)
        </span>
      )}
      <input
        type="file"
        accept={acceptedFileTypes}
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelected}
      />

      <button
        onClick={isDone ? handleLihatHasilReview : handleStart}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-[#0B1739] disabled:bg-[#0B1739]/50 text-white font-semibold py-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <UploadCloud className="w-4 h-4" aria-hidden="true" />
        {submitting
          ? "Mengupload..."
          : isDone
            ? "Lihat Hasil Review"
            : data.status === "submitted"
              ? "Kirim Ulang Tugas"
              : "Mulai Tugas"}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B1739] pb-28 md:pb-16">
      <div className="max-w-md md:max-w-5xl xl:max-w-6xl mx-auto px-5 md:px-8 pt-10">
        <button
          onClick={() => router.push(`/learning-path/${moduleId}`)}
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Kembali ke {data.module_title}
        </button>

        {/* Container grid SELALU dipakai (tidak lagi bercabang berdasarkan
            hasExtraContent) — supaya lebar halaman konsisten terlepas dari
            assignment ini punya learning_outcomes/tools/dst atau belum.
            Kolom kanan tetap hanya dirender kalau ada extra content; kalau
            tidak ada, kolom kiri "melebar" mengambil ruang kolom kanan lewat
            md:col-span-3 supaya tidak ada ruang kosong menggantung. */}
        <div className="md:grid md:grid-cols-3 md:gap-6 md:items-start">
          {/* Kolom kiri: ringkasan assignment + alur tugas, sticky di desktop
              — pola sama seperti sidebar "Ringkasan" di Module Detail. */}
          <div
            className={`md:sticky md:top-6 space-y-4 mb-4 md:mb-0 ${
              hasExtraContent ? "md:col-span-1" : "md:col-span-3"
            }`}
          >
            <div className="bg-white rounded-2xl p-5">
              <div className="flex justify-between items-start gap-2 mb-1">
                <h1 className="text-lg md:text-xl font-bold text-[#0B1739]">
                  {data.title}
                </h1>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    STATUS_STYLE[data.status] ?? STATUS_FALLBACK
                  }`}
                >
                  {STATUS_LABEL[data.status] ?? data.status}
                </span>
              </div>
              {data.description && (
                <p className="text-gray-500 text-sm">{data.description}</p>
              )}
              {data.due_date && (
                <span
                  className={`flex items-center gap-1 text-xs mt-2 ${DUE_DATE_STYLE[dueUrgency]}`}
                >
                  <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Tenggat: {formatDueDate(data.due_date)}
                  {dueUrgency === "overdue" && " (Lewat tenggat)"}
                  {dueUrgency === "urgent" && " (Segera berakhir)"}
                </span>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5">
              <h2 className="flex items-center gap-2 font-bold text-[#0B1739] mb-3">
                <ListTodo
                  className="w-4 h-4 text-blue-600"
                  aria-hidden="true"
                />
                Alur Tugas
              </h2>
              <ol aria-label="Progres pengerjaan tugas">
                {alurTugas.map((step, i) => {
                  const isCurrent = i === currentStepIndex;
                  const isLast = i === alurTugas.length - 1;
                  // Step "Hasil Review" boleh dibuka lebih awal (begitu
                  // tugas submitted), bukan hanya saat sudah successful —
                  // lihat penjelasan di `canViewReview`.
                  const isReviewStep = step.label === "Hasil Review";
                  const isClickable = isReviewStep && canViewReview;

                  const connectorLine = !isLast && (
                    <span
                      className={`absolute left-3.5 top-7 w-px h-[calc(100%-1.75rem)] ${
                        step.done ? "bg-green-200" : "bg-gray-200"
                      }`}
                      aria-hidden="true"
                    />
                  );

                  const icon = (
                    <div
                      className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center z-10 ${
                        step.done
                          ? "bg-green-50"
                          : isCurrent
                            ? "bg-blue-50 ring-2 ring-blue-200"
                            : "bg-gray-50"
                      }`}
                    >
                      {step.done ? (
                        <CheckCircle2
                          className="w-4 h-4 text-green-600"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle
                          className={`w-4 h-4 ${
                            isCurrent ? "text-blue-500" : "text-gray-300"
                          }`}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  );

                  const label = (
                    <div className="flex flex-col justify-center">
                      <span
                        className={`text-sm ${
                          step.done
                            ? "text-[#0B1739] font-medium"
                            : isCurrent
                              ? "text-blue-600 font-semibold"
                              : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </span>
                      {isClickable && (
                        <span className="text-xs text-blue-500">
                          {data.status === "submitted"
                            ? "Lihat status review →"
                            : "Lihat hasil →"}
                        </span>
                      )}
                    </div>
                  );

                  return (
                    <li key={step.label} className="relative">
                      {connectorLine}
                      {isClickable ? (
                        <button
                          type="button"
                          onClick={handleLihatHasilReview}
                          className="w-full flex gap-3 pb-2.5 text-left rounded-lg -mx-1 px-1 hover:bg-blue-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                          aria-label={
                            data.status === "submitted"
                              ? "Lihat status Hasil Review — tugas masih menunggu direview mentor"
                              : "Lihat Hasil Review"
                          }
                        >
                          {icon}
                          {label}
                        </button>
                      ) : (
                        <div className="flex gap-3 pb-2.5">
                          {icon}
                          {label}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Di layout satu kolom (tanpa extra content), kartu aksi
                langsung menyusul di bawah Alur Tugas, bukan menggantung
                sendirian di kolom kanan yang kosong. */}
            {!hasExtraContent && actionCard}
          </div>

          {hasExtraContent && (
            <div className="md:col-span-2 space-y-4">
              {Array.isArray(data.learning_outcomes) &&
                data.learning_outcomes.length > 0 && (
                  <div className="bg-white rounded-2xl p-5">
                    <h2 className="flex items-center gap-2 font-bold text-[#0B1739] mb-3">
                      <Target
                        className="w-4 h-4 text-blue-600"
                        aria-hidden="true"
                      />
                      Learning Outcomes
                    </h2>
                    <ul className="space-y-2">
                      {data.learning_outcomes.map((item, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-600 flex gap-2"
                        >
                          <span className="text-blue-600 shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {Array.isArray(data.skills_learned) &&
                data.skills_learned.length > 0 && (
                  <div className="bg-white rounded-2xl p-5">
                    <h2 className="flex items-center gap-2 font-bold text-[#0B1739] mb-3">
                      <Sparkles
                        className="w-4 h-4 text-purple-600"
                        aria-hidden="true"
                      />
                      Skills Learned
                    </h2>
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

              {Array.isArray(data.prerequisites) &&
                data.prerequisites.length > 0 && (
                  <div className="bg-white rounded-2xl p-5">
                    <h2 className="flex items-center gap-2 font-bold text-[#0B1739] mb-3">
                      <Layers
                        className="w-4 h-4 text-orange-600"
                        aria-hidden="true"
                      />
                      Prerequisites
                    </h2>
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

              {Array.isArray(data.tools) && data.tools.length > 0 && (
                <div className="bg-white rounded-2xl p-5">
                  <h2 className="flex items-center gap-2 font-bold text-[#0B1739] mb-3">
                    <Wrench
                      className="w-4 h-4 text-gray-500"
                      aria-hidden="true"
                    />
                    Tools
                  </h2>
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

              {Array.isArray(data.evaluation_rubrics) &&
                data.evaluation_rubrics.length > 0 && (
                  <div className="bg-white rounded-2xl p-5">
                    <h2 className="flex items-center gap-2 font-bold text-[#0B1739] mb-3">
                      <BarChart3
                        className="w-4 h-4 text-green-600"
                        aria-hidden="true"
                      />
                      Evaluation Rubrics
                    </h2>
                    <ul className="space-y-2">
                      {data.evaluation_rubrics.map((rubric, i) => (
                        <li key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {rubric.criteria}
                          </span>
                          <span className="text-[#0B1739] font-semibold">
                            {rubric.weight}%
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {actionCard}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center justify-between gap-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3 mt-4">
            <span>{error}</span>
            <button
              onClick={() => {
                setUploadError(null);
                setValidationError(null);
                fetchAssignment();
              }}
              className="flex items-center gap-1 text-xs font-semibold text-red-200 hover:text-white shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
            >
              <RefreshCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Coba lagi
            </button>
          </div>
        )}
      </div>

      {/* Sticky CTA di mobile: satu-satunya tempat tombol aksi muncul di
          layar sempit (actionCard disembunyikan di mobile lewat
          "hidden md:block"). Exclusivity-nya dijamin oleh breakpoint,
          bukan oleh hasExtraContent — supaya tidak ada kombinasi data
          yang bisa memicu dua tombol tampil bersamaan lagi. */}
      {(isDone || currentStepLabel) && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0B1739] border-t border-white/10 px-5 py-3 z-20">
          {!isDone && (
            <p className="text-xs text-white/50 mb-2">
              Langkah berikutnya:{" "}
              <span className="font-medium text-white/80">
                {currentStepLabel}
              </span>
            </p>
          )}
          <button
            onClick={isDone ? handleLihatHasilReview : handleStart}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-white disabled:bg-white/50 text-[#0B1739] font-semibold py-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <UploadCloud className="w-4 h-4" aria-hidden="true" />
            {submitting
              ? "Mengupload..."
              : isDone
                ? "Lihat Hasil Review"
                : data.status === "submitted"
                  ? "Kirim Ulang Tugas"
                  : "Mulai Tugas"}
          </button>
        </div>
      )}

      {/* Dialog konfirmasi sebelum menimpa submission lama. Ditaruh paling
          bawah supaya z-index tumpukannya jelas dan tidak konflik dengan
          sticky CTA di atas. */}
      {pendingResubmitFile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="resubmit-dialog-title"
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-5"
        >
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full">
            <h2
              id="resubmit-dialog-title"
              className="font-bold text-[#0B1739] mb-2"
            >
              Kirim ulang tugas?
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              File{" "}
              <span className="font-medium text-gray-700">
                {pendingResubmitFile.name}
              </span>{" "}
              akan menggantikan submission sebelumnya. Tindakan ini tidak bisa
              dibatalkan.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingResubmitFile(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
              >
                Batal
              </button>
              <button
                onClick={confirmResubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0B1739] disabled:bg-[#0B1739]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                {submitting ? "Mengupload..." : "Ya, Kirim Ulang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#0B1739] pb-16 animate-pulse">
      <div className="max-w-md md:max-w-5xl xl:max-w-6xl mx-auto px-5 md:px-8 pt-10">
        <div className="h-4 w-40 bg-white/10 rounded mb-4" />
        <div className="md:grid md:grid-cols-3 md:gap-6 md:items-start">
          <div className="md:col-span-1 mb-4 md:mb-0 space-y-4">
            <div className="bg-white/5 rounded-2xl p-5 space-y-3">
              <div className="h-5 w-3/4 bg-white/10 rounded" />
              <div className="h-3 w-full bg-white/10 rounded" />
              <div className="h-3 w-5/6 bg-white/10 rounded" />
            </div>
            <div className="bg-white/5 rounded-2xl p-5 space-y-3">
              <div className="h-4 w-24 bg-white/10 rounded mb-1" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-6 w-full bg-white/10 rounded" />
              ))}
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-5 space-y-2">
                <div className="h-4 w-32 bg-white/10 rounded mb-2" />
                <div className="h-3 w-full bg-white/10 rounded" />
                <div className="h-3 w-2/3 bg-white/10 rounded" />
              </div>
            ))}
            <div className="bg-white/5 rounded-2xl p-5">
              <div className="h-11 w-full bg-white/10 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}