"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import type { AssignmentReviewResponse } from "@/types/assignment-review";
import {
  ArrowLeft,
  Sparkles,
  MessageSquareText,
  Paperclip,
  CalendarCheck,
  UserCircle2,
  RefreshCcw,
  Clock8,
} from "lucide-react";

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

// Label kualitatif untuk mentor_score — dipisah dari SkillMap agar bisa
// disesuaikan independen (skala evaluasi assignment tidak wajib identik
// dengan skala skill level 1-5).
function getScoreLabel(score: number): { text: string; color: string } {
  if (score >= 90) return { text: "Istimewa", color: "text-green-600" };
  if (score >= 75) return { text: "Sangat Baik", color: "text-blue-600" };
  if (score >= 60) return { text: "Cukup Baik", color: "text-amber-600" };
  return { text: "Perlu Perbaikan", color: "text-red-500" };
}

function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AssignmentReviewPage() {
  const { moduleId, assignmentId } = useParams<{
    moduleId: string;
    assignmentId: string;
  }>();
  const router = useRouter();

  const [data, setData] = useState<AssignmentReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchReview() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<AssignmentReviewResponse>(
        `/assignments/${assignmentId}/review`
      );
      setData(res.data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        router.replace(`/learning-path/${moduleId}/assignments/${assignmentId}`);
        return;
      }
      setError("Gagal memuat hasil review.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReview();
  }, [assignmentId]);

  if (loading) {
    return <ReviewSkeleton />;
  }

  if (!data) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-3 overflow-x-hidden bg-[#0B1739] px-5 text-center">
        <HeaderGlow />
        <p className="text-white/70">{error ?? "Hasil review tidak ditemukan."}</p>
        <button
          onClick={fetchReview}
          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Coba lagi
        </button>
      </div>
    );
  }

  // Belum direview sama sekali — misalnya user klik lewat item alur yang
  // belum "done", atau langsung buka URL-nya manual.
  if (!data.review) {
    return (
      <div className="relative min-h-screen overflow-x-hidden bg-[#0B1739] pb-16">
        <HeaderGlow />
        {/* Container tetap lebar (sama seperti state sudah-direview & halaman
            lain), kontennya sendiri di-center pakai max-w-xl mx-auto —
            bukan mempersempit seluruh halaman lewat container ini. */}
        <div className="mx-auto max-w-md px-5 pt-10 md:max-w-5xl md:px-8 xl:max-w-6xl">
          <BackButton moduleId={moduleId} assignmentId={assignmentId} router={router} />
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <Clock8 className="h-6 w-6 text-blue-600" aria-hidden="true" />
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
              Menunggu Review
            </span>
            <p className="text-sm leading-relaxed text-gray-500">
              Tugas kamu untuk{" "}
              <span className="font-semibold text-[#0B1739]">{data.assignment.title}</span>{" "}
              masih menunggu direview mentor. Hasilnya akan muncul di sini
              begitu selesai.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { review, assignment, progress } = data;
  const scoreLabel = getScoreLabel(review.mentor_score);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0B1739] pb-16">
      <HeaderGlow />
      <div className="mx-auto max-w-md px-5 pt-10 md:max-w-5xl md:px-8 xl:max-w-6xl">
        <BackButton moduleId={moduleId} assignmentId={assignmentId} router={router} />

        <div className="md:grid md:grid-cols-3 md:items-start md:gap-6">
          {/* Kolom kiri: skor & metadata, sticky di desktop — pola sama
              seperti kartu ringkasan modul di Module Detail. */}
          <div className="mb-4 space-y-4 md:col-span-1 md:sticky md:top-6 md:mb-0">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
              <p className="text-lg font-bold text-[#0B1739] md:text-xl">Hasil Review</p>
              <p className="mb-4 text-sm text-gray-400">{assignment.title}</p>

              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                Skor Mentor
              </p>
              <p className={`text-5xl font-bold ${scoreLabel.color}`}>
                {review.mentor_score}
              </p>
              <p className={`mt-1 text-sm font-semibold ${scoreLabel.color}`}>
                {scoreLabel.text}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              {progress.file_name && progress.file_path && (
                <a
                  href={progress.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-3 flex w-fit items-center gap-1.5 rounded text-sm text-blue-600 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                  {progress.file_name}
                </a>
              )}
              <p className="flex items-center gap-1.5 text-xs text-gray-400">
                <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Direview pada {formatTanggal(review.reviewed_at)}
              </p>
              {review.reviewed_by && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
                  <UserCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Oleh {review.reviewed_by.name}
                </p>
              )}
            </div>
          </div>

          {/* Kolom kanan: feedback & skill yang terpengaruh — konten utama
              yang lebih panjang untuk dibaca. */}
          <div className="space-y-4 md:col-span-2">
            {review.mentor_feedback && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                <h2 className="mb-3 flex items-center gap-2 font-bold text-[#0B1739]">
                  <MessageSquareText className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  Feedback Mentor
                </h2>
                <p className="text-sm leading-relaxed text-gray-600">
                  {review.mentor_feedback}
                </p>
              </div>
            )}

            {assignment.skills.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                <h2 className="mb-3 flex items-center gap-2 font-bold text-[#0B1739]">
                  <Sparkles className="h-4 w-4 text-purple-600" aria-hidden="true" />
                  Berkontribusi ke Skill
                </h2>
                <div className="flex flex-wrap gap-2">
                  {assignment.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-400">
                  Skor ini ikut dihitung di Skill Map kamu untuk skill di atas.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BackButton({
  moduleId,
  assignmentId,
  router,
}: {
  moduleId: string;
  assignmentId: string;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <button
      onClick={() =>
        router.push(`/learning-path/${moduleId}/assignments/${assignmentId}`)
      }
      className="mb-4 flex items-center gap-1.5 rounded text-sm text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Kembali ke Assignment
    </button>
  );
}

function ReviewSkeleton() {
  return (
    <div className="relative min-h-screen animate-pulse overflow-x-hidden bg-[#0B1739] pb-16">
      <HeaderGlow />
      <div className="mx-auto max-w-md px-5 pt-10 md:max-w-5xl md:px-8 xl:max-w-6xl">
        <div className="mb-4 h-4 w-32 rounded bg-white/10" />
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="mb-4 space-y-4 md:col-span-1 md:mb-0">
            <div className="h-52 rounded-2xl bg-white/5" />
            <div className="h-28 rounded-2xl bg-white/5" />
          </div>
          <div className="space-y-4 md:col-span-2">
            <div className="h-40 rounded-2xl bg-white/5" />
            <div className="h-32 rounded-2xl bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}