"use client";

import { useEffect, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "@/lib/api";
import type { SkillMapResponse } from "@/types/skill";

export default function SkillMapPage() {
  const [data, setData] = useState<SkillMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSkillMap() {
      try {
        const res = await api.get<SkillMapResponse>("/skill-map");
        setData(res.data);
      } catch {
        setError(
          "Belum ada skill yang dinilai. Selesaikan Skill Assessment dulu."
        );
      } finally {
        setLoading(false);
      }
    }
    fetchSkillMap();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white">
        Menghitung skill map...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-center px-6">
        <p className="text-white/70">{error}</p>
      </div>
    );
  }

  const chartData = data.chart_data.map((item) => ({
    skill: item.skill_name,
    "Current Skills": item.current,
    "Industry Requirements": item.required,
  }));

  return (
    <div className="min-h-screen bg-[#0B1739] pb-16">
      <div className="max-w-md mx-auto px-5 pt-10">
        <h1 className="text-white text-3xl font-bold mb-2">Your Skill Map</h1>
        <p className="text-white/70 text-sm mb-6">
          Lihat bagaimana keterampilan Anda dibandingkan dengan persyaratan
          industri.
        </p>

        <SummaryCard
          label="Tingkat Saat Ini"
          value={data.summary.current_level}
          sub="Gabungan self-rating, confidence & quiz"
          color="text-blue-500"
        />
        <SummaryCard
          label="Tingkat yang Diperlukan"
          value={data.summary.required_level}
          sub="Standar industri"
          color="text-purple-500"
        />
        <SummaryCard
          label="Kesenjangan Keterampilan"
          value={data.summary.skill_gap}
          sub="Poin yang perlu ditingkatkan"
          color="text-orange-500"
        />

        {/* Breakdown transparansi - dari mana angka "Tingkat Saat Ini" berasal */}
        <div className="bg-white rounded-2xl p-4 mb-3">
          <p className="text-gray-500 text-xs mb-3">
            Tingkat Saat Ini dihitung dari 3 sumber:
          </p>
          <BreakdownRow
            label="Self-Rating (Step 1)"
            value={`${data.summary.breakdown.self_rating.toFixed(1)} / 5`}
          />
          <BreakdownRow
            label="Scenario Confidence (Step 2)"
            value={
              data.summary.breakdown.scenario_confidence !== null
                ? `${data.summary.breakdown.scenario_confidence.toFixed(1)} / 5`
                : "Belum diisi"
            }
          />
          <BreakdownRow
            label="Skill Verification Quiz (Step 3)"
            value={
              data.summary.breakdown.quiz_score_percentage !== null
                ? `${data.summary.breakdown.quiz_score_percentage}% benar`
                : "Belum diisi"
            }
          />
        </div>

        <div className="bg-white rounded-2xl p-4 mt-2">
          <h2 className="font-bold text-[#0B1739] text-center mb-2">
            Skills Analysis
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
              <Radar
                name="Current Skills"
                dataKey="Current Skills"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.35}
              />
              <Radar
                name="Industry Requirements"
                dataKey="Industry Requirements"
                stroke="#7c3aed"
                fill="#7c3aed"
                fillOpacity={0.25}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <button
          onClick={() => (window.location.href = "/learning-path")}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 rounded-xl mt-6 flex items-center justify-center gap-2"
        >
          ✨ Generate Learning Path dengan AI
        </button>
      </div>
    </div>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-[#0B1739] font-medium">{value}</span>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 mb-3">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value.toFixed(1)}</p>
      <p className="text-gray-400 text-xs">{sub}</p>
    </div>
  );
}