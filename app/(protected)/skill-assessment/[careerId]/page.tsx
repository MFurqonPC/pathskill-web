"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import type { SkillAssessmentResponse, SkillItem } from "@/types/skill";
import AssessmentStepIndicator from "@/components/AssessmentStepIndicator";

const CATEGORY_LABEL: Record<string, string> = {
  core: "Core Skills",
  tools: "Tools",
  soft_skills: "Soft Skills",
};

export default function SkillAssessmentPage() {
  const { careerId } = useParams<{ careerId: string }>();
  const router = useRouter();

  const [data, setData] = useState<SkillAssessmentResponse | null>(null);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSkills() {
      try {
        const res = await api.get<SkillAssessmentResponse>(
          `/careers/${careerId}/skills`
        );
        setData(res.data);

        // isi state rating dari current_rating yang sudah ada (kalau sebelumnya pernah diisi)
        const initial: Record<number, number> = {};
        Object.values(res.data.skills).forEach((group) => {
          group.forEach((skill) => {
            if (skill.current_rating) initial[skill.id] = skill.current_rating;
          });
        });
        setRatings(initial);
      } catch {
        setError("Gagal memuat data skill assessment.");
      } finally {
        setLoading(false);
      }
    }
    fetchSkills();
  }, [careerId]);

  function handleRate(skillId: number, value: number) {
    setRatings((prev) => ({ ...prev, [skillId]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ratings: Object.entries(ratings).map(([career_skill_id, rating]) => ({
          career_skill_id: Number(career_skill_id),
          rating,
        })),
      };
      await api.post("/skill-assessments", payload);
      router.push(`/skill-assessment/${careerId}/self-assess`);
    } catch {
      setError("Gagal menyimpan skill assessment. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white">
        Memuat skill assessment...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white">
        {error ?? "Data tidak ditemukan."}
      </div>
    );
  }

  const totalSkills = Object.values(data.skills).flat().length;
  const totalRated = Object.keys(ratings).length;

  return (
    <div className="min-h-screen bg-[#0B1739] pb-32">
      <div className="max-w-md mx-auto px-5 pt-10">
        <p className="text-white/60 text-sm mb-1">PATHSKILL</p>
        <AssessmentStepIndicator currentStep={1} />
        <h1 className="text-white text-3xl font-bold mb-2">Skill Assessment</h1>
        <p className="text-white/70 text-sm mb-6">
          Beri nilai tingkat keahlian Anda saat ini dari 1 (Pemula) hingga 5 (Pakar)
        </p>

        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">{data.career.icon}</span>
          <span className="text-white font-semibold text-lg">
            {data.career.name}
          </span>
        </div>

        {(["core", "tools", "soft_skills"] as const).map((category) => {
          const skills = data.skills[category];
          if (!skills || skills.length === 0) return null;

          return (
            <div
              key={category}
              className="bg-white rounded-2xl p-5 mb-4 shadow-sm"
            >
              <h2 className="font-bold text-[#0B1739] mb-4">
                {CATEGORY_LABEL[category]}
              </h2>
              {skills.map((skill: SkillItem) => (
                <SkillRow
                  key={skill.id}
                  skill={skill}
                  value={ratings[skill.id]}
                  onRate={(v) => handleRate(skill.id, v)}
                />
              ))}
            </div>
          );
        })}

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}
      </div>

      {/* sticky footer, mirip pola "View My Skill Map" di prototype */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0B1739] border-t border-white/10 p-4">
        <div className="max-w-md mx-auto">
          <p className="text-white/60 text-xs text-center mb-2">
            {totalRated} / {totalSkills} skill sudah dinilai
          </p>
          <button
            onClick={handleSubmit}
            disabled={submitting || totalRated === 0}
            className="w-full bg-blue-600 disabled:bg-blue-600/40 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {submitting ? "Menyimpan..." : "Lanjut ke Step 2"}
            {!submitting && <span>→</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkillRow({
  skill,
  value,
  onRate,
}: {
  skill: SkillItem;
  value: number | undefined;
  onRate: (v: number) => void;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm font-medium text-[#0B1739]">
          {skill.skill_name}
        </span>
        <span className="text-xs text-gray-400">
          {value ? `${value} / 5` : "Not rated"}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onRate(n)}
            className={`border rounded-lg py-2 text-sm transition-colors ${
              value === n
                ? "bg-[#0B1739] text-white border-[#0B1739]"
                : "border-gray-300 text-gray-600 hover:border-[#0B1739]"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}