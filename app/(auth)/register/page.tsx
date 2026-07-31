"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { LogoMark } from "@/components/ui/Logo";
import {
  AuthInput,
  AuthCheckbox,
  AuthErrorBanner,
  AuthSubmitButton,
} from "@/components/ui/AuthField";
import { getAuthErrorMessage } from "@/lib/authError";

const HIGHLIGHTS = [
  "Learning path dipersonalisasi dari hasil skill assessment kamu",
  "Progress tersimpan otomatis di setiap modul dan tugas",
  "Rekomendasi materi berbasis kebutuhan industri IT terkini",
];

interface RegisterResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    career_goal_id: number | null;
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!name.trim()) return "Nama wajib diisi.";
    if (!email.trim()) return "Email wajib diisi.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Format email tidak valid.";
    if (password.length < 8) return "Password minimal 8 karakter.";
    if (password !== passwordConfirmation) return "Konfirmasi password tidak sama.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<RegisterResponse>("/register", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        remember_me: rememberMe,
      });
      setSession(res.data.token, res.data.user);
      router.push("/profile-setup");
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, "Gagal mendaftar. Coba lagi."));
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

          <ul className="hidden md:block mt-10 space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-white/80 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

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
            <AuthInput
              id="name"
              name="name"
              type="text"
              label="Nama Lengkap"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Budi Santoso"
            />

            <AuthInput
              id="email"
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@example.com"
            />

            <AuthInput
              id="password"
              name="password"
              type="password"
              label="Password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
            />

            <AuthInput
              id="password_confirmation"
              name="password_confirmation"
              type="password"
              label="Konfirmasi Password"
              autoComplete="new-password"
              required
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="Ulangi password"
            />

            <AuthCheckbox
              id="remember_me"
              label="Ingat saya"
              checked={rememberMe}
              onChange={setRememberMe}
            />

            {error && <AuthErrorBanner message={error} />}

            <AuthSubmitButton loading={loading} loadingLabel="Memproses...">
              Daftar
            </AuthSubmitButton>
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