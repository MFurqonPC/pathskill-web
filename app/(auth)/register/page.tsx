"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { LogoMark } from "@/components/ui/Logo";

const HIGHLIGHTS = [
  "Learning path dipersonalisasi dari hasil skill assessment kamu",
  "Progress tersimpan otomatis di setiap modul dan tugas",
  "Rekomendasi materi berbasis kebutuhan industri IT terkini",
];

// Class dasar untuk semua input form — dipusatkan biar konsisten
// dan gampang di-maintain kalau mau ubah style sekali lagi nanti.
const inputClass =
  "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B1739] focus:border-transparent transition";
const labelClass = "text-sm font-medium text-gray-800 block mb-1";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/register", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        remember_me: rememberMe,
      });
      localStorage.setItem("pathskill_token", res.data.token);
      router.push("/profile-setup");
    } catch (err: any) {
      const messages = err.response?.data?.errors;
      setError(
        messages
          ? Object.values(messages).flat().join(" ")
          : "Gagal mendaftar. Coba lagi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-b md:bg-gradient-to-br from-[#0B1739] to-[#1E2A5E]">
      <div className="relative overflow-hidden md:w-1/2 md:min-h-screen md:flex md:flex-col md:justify-center px-6 pt-16 pb-8 md:px-16 md:py-0 text-center md:text-left">
        <div className="hidden md:block absolute -top-24 -left-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="hidden md:block absolute bottom-0 right-0 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-md w-full mx-auto md:mx-0">
          <div className="flex justify-center md:justify-start mb-4">
            <LogoMark size={48} />
          </div>
          <p className="text-white/80 font-bold tracking-wide text-sm mb-8">
            PATHSKILL
          </p>
          <h1 className="text-white text-2xl md:text-4xl font-bold mb-1">
            Buat Akun Baru!
          </h1>
          <p className="text-white/70 text-sm md:text-base">
            Akses kembali learning path kamu
          </p>

          {/* Desktop: highlight lengkap */}
          <ul className="hidden md:block mt-10 space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-white/80 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* Mobile: versi ringkas 1 baris supaya value prop tetap kebaca tanpa makan tempat */}
          <p className="md:hidden mt-4 text-white/70 text-xs">
            {HIGHLIGHTS[0]}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-t-3xl md:rounded-none flex-1 md:flex-none px-6 pt-8 pb-10 md:w-1/2 md:min-h-screen md:flex md:items-center md:justify-center md:px-16 md:py-0">
        <div className="max-w-md w-full mx-auto">
          <h2 className="hidden md:block text-2xl font-bold text-[#0B1739] mb-6">
            Buat Akun Baru
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="name" className={labelClass}>
                Nama Lengkap
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Budi Santoso"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password_confirmation" className={labelClass}>
                Konfirmasi Password
              </label>
              <input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                autoComplete="new-password"
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Ulangi password"
                className={inputClass}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-[#3B4A9C] w-4 h-4"
              />
              Ingat saya
            </label>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 text-sm px-3 py-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3B4A9C] hover:bg-[#2f3c80] disabled:bg-[#3B4A9C]/50 text-white font-semibold py-3 rounded-xl mt-2 transition-colors"
            >
              {loading ? "Memproses..." : "Daftar"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}