"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { Career } from "@/types/skill";
import { User, Target, ArrowRight, Sparkles } from "lucide-react";

export default function ProfileSetupPage() {
  const router = useRouter();
  const [careers, setCareers] = useState<Career[]>([]);
  const [selectedCareerId, setSelectedCareerId] = useState<number | null>(null);
  const [educationBackground, setEducationBackground] = useState("");
  const [interest, setInterest] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCareers() {
      try {
        const res = await api.get<{ data: Career[] }>("/careers");
        setCareers(res.data.data);
      } catch {
        setError("Gagal memuat daftar karier.");
      } finally {
        setLoading(false);
      }
    }
    fetchCareers();
  }, []);

  async function handleContinue() {
    if (!selectedCareerId) {
      setError("Pilih salah satu karier tujuan dulu.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // simpan career goal + info tambahan profil
      await api.post(`/careers/${selectedCareerId}/select`, {
        education_background: educationBackground,
        interest,
      });
      router.push(`/skill-assessment/${selectedCareerId}`);
    } catch {
      setError("Gagal menyimpan pilihan karier. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center text-white">
        Memuat...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1739] pb-28 md:pb-16">
      <div className="max-w-md md:max-w-4xl xl:max-w-5xl mx-auto px-5 md:px-8 pt-10">
        <h1 className="text-white text-2xl md:text-3xl font-bold mb-1">
          Ceritakan Tentang Diri Anda
        </h1>
        <p className="text-white/70 text-sm mb-6">
          Bantu kami mempersonalisasi perjalanan pembelajaran Anda.
        </p>

        <div className="md:grid md:grid-cols-2 md:gap-6 md:items-start">
          {/* Informasi Dasar */}
          <div className="bg-white rounded-2xl p-5 mb-4">
            <h2 className="font-bold text-[#0B1739] flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-blue-600" aria-hidden="true" />
              Informasi Dasar
            </h2>

            <label className="text-sm text-gray-700 block mb-1">
              Latar Belakang Pendidikan
            </label>
            <input
              type="text"
              placeholder="contohnya, Sarjana Ilmu Komputer"
              value={educationBackground}
              onChange={(e) => setEducationBackground(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 mb-4 text-[#0B1739] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B1739]"
            />

            <label className="text-sm text-gray-700 block mb-1">Minat</label>
            <textarea
              placeholder="Ceritakan tentang minat Anda dan apa yang membuat Anda bersemangat."
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-[#0B1739] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B1739]"
            />

            <div className="flex items-start gap-2 bg-blue-50 rounded-lg px-3 py-2.5 mt-4">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-gray-500">
                Info ini dipakai AI kami untuk menyusun learning path yang
                sesuai dengan latar belakang dan minatmu — bukan cuma
                template yang sama untuk semua orang.
              </p>
            </div>
          </div>

          {/* Pilih Karier Tujuan */}
          <div className="bg-white rounded-2xl p-5 mb-4">
            <h2 className="font-bold text-[#0B1739] flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-purple-600" aria-hidden="true" />
              Pilih Karier Tujuan Anda
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {careers.map((career) => (
                <button
                  key={career.id}
                  onClick={() => setSelectedCareerId(career.id)}
                  className={`w-full text-left border rounded-xl p-4 transition-colors ${
                    selectedCareerId === career.id
                      ? "border-[#0B1739] bg-[#0B1739]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl" aria-hidden="true">
                      {career.icon}
                    </span>
                    <div>
                      <p className="font-semibold text-[#0B1739] text-sm">
                        {career.name}
                      </p>
                      {career.description && (
                        <p className="text-gray-500 text-xs mt-0.5">
                          {career.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mb-2">{error}</p>
        )}
      </div>

      {/* Mobile: bar aksi menempel di bawah layar.
         Desktop: kembali jadi bagian normal dari alur konten, rata kanan. */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0B1739] border-t border-white/10 p-4 md:static md:border-0 md:p-0 md:mt-2">
        <div className="max-w-md md:max-w-4xl xl:max-w-5xl mx-auto md:px-8 md:flex md:justify-end">
          <button
            onClick={handleContinue}
            disabled={submitting}
            className="w-full md:w-64 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {submitting ? "Menyimpan..." : "Lanjut ke Skill Assessment"}
            {!submitting && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  );
}