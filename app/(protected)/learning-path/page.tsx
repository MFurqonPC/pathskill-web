"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import type { LearningPathResponse } from "@/types/learning-path";

export default function LearningPathPage() {
  const [data, setData] = useState<LearningPathResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [needsGenerate, setNeedsGenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchLearningPath() {
    try {
      const res = await api.get<LearningPathResponse>("/learning-path");
      setData(res.data);
      setNeedsGenerate(res.data.modules.length === 0);
    } catch {
      setError("Gagal memuat learning path.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLearningPath();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      await api.post("/learning-path/generate");
      await fetchLearningPath();
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
          "Gagal generate learning path. Coba lagi."
      );
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white">
        Memuat learning path...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1739] pb-16">
      <div className="max-w-md mx-auto px-5 pt-10">
        <h1 className="text-white text-2xl font-bold mb-1">
          Your Learning Path
        </h1>
        <p className="text-white/60 text-sm mb-4">
          Ikuti peta jalan yang dipersonalisasi ini untuk mencapai tujuan
          karir Anda.
        </p>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        {needsGenerate ? (
          <div className="bg-white rounded-2xl p-6 text-center">
            <p className="text-gray-500 text-sm mb-4">
              Belum ada learning path untuk career ini. Generate otomatis
              berdasarkan hasil Skill Assessment kamu.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl"
            >
              {generating
                ? "Menyusun learning path dengan AI..."
                : "✨ Generate Learning Path dengan AI"}
            </button>
          </div>
        ) : (
          data && (
            <>
              <div className="bg-white rounded-2xl p-5 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-[#0B1739] text-sm">
                    Overall Progress
                  </span>
                  <span className="text-blue-600 text-sm">
                    {data.overall_progress.completed_modules} /{" "}
                    {data.overall_progress.total_modules} Modules
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{
                      width: `${
                        (data.overall_progress.completed_modules /
                          Math.max(data.overall_progress.total_modules, 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <MiniStat label="Total Lessons" value={data.total_lessons} color="text-blue-600" />
                  <MiniStat label="Assignments" value={data.total_assignments} color="text-purple-600" />
                  <MiniStat label="Duration" value={`${data.estimated_duration_weeks}w`} color="text-green-600" />
                </div>
              </div>

              <h2 className="text-white font-semibold mb-3">
                Learning Modules
              </h2>
              {data.modules.map((module, idx) => (
                <Link
                  key={module.id}
                  href={`/learning-path/${module.id}`}
                  className="block bg-white rounded-2xl p-4 mb-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#0B1739] text-sm">
                          {module.title}
                        </p>
                        {module.ai_generated && (
                          <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
                            ✨ AI
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {module.total_lessons} Lessons ·{" "}
                        {module.total_assignments} Assignments
                      </p>
                    </div>
                    <span className="text-gray-400">›</span>
                  </div>
                </Link>
              ))}
            </>
          )
        )}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div>
      <p className={`font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}