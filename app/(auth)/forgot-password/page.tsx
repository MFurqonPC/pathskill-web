"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { LogoMark } from "@/components/ui/Logo";
import { AuthInput, AuthErrorBanner, AuthSubmitButton } from "@/components/ui/AuthField";
import { getAuthErrorMessage } from "@/lib/authError";

function MailIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6.5C3 5.67157 3.67157 5 4.5 5H19.5C20.3284 5 21 5.67157 21 6.5V17.5C21 18.3284 20.3284 19 19.5 19H4.5C3.67157 19 3 18.3284 3 17.5V6.5Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 6.5L12 12.5L20 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12.5L10.5 15L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function validate(): string | null {
    if (!email.trim()) return "Email wajib diisi.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Format email tidak valid.";
    return null;
  }

  async function sendResetLink() {
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await api.post("/forgot-password", { email });
      setSent(true);
      setCooldown(30);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, "Gagal mengirim tautan reset. Coba lagi."));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendResetLink();
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-b md:bg-gradient-to-br from-[#0B1739] to-[#1E2A5E]">
      <div className="relative overflow-hidden md:w-1/2 md:min-h-screen md:flex md:flex-col md:justify-center px-6 pt-12 pb-8 md:px-16 md:py-0 text-center md:text-left">
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
            Lupa Password?
          </h1>
          <p className="text-white/70 text-sm md:text-base">
            Tenang, kami bantu kamu masuk lagi
          </p>
        </div>
      </div>

      <div className="bg-white rounded-t-3xl md:rounded-none flex-1 md:flex-none flex flex-col justify-center px-6 py-10 md:w-1/2 md:min-h-screen md:px-16 md:py-0">
        <div className="max-w-md w-full mx-auto">
          {sent ? (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <CheckIcon className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-bold text-[#0B1739] mb-2">
                Cek Email Kamu
              </h2>
              <p className="text-sm text-gray-500">
                Jika{" "}
                <span className="font-medium text-[#0B1739]">{email}</span>{" "}
                terdaftar di PathSkill, tautan reset sudah kami kirim.
              </p>

              <a
                href="https://mail.google.com/mail/u/0/#search/PathSkill"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#3B4A9C] hover:bg-[#2f3c80] text-white font-semibold py-3 rounded-xl mt-8 transition-colors"
              >
                <MailIcon className="w-5 h-5" />
                Buka Gmail
              </a>

              <button
                type="button"
                onClick={sendResetLink}
                disabled={cooldown > 0 || loading}
                className="w-full text-sm font-medium text-gray-500 hover:text-[#0B1739] disabled:text-gray-300 py-3 mt-1 transition-colors"
              >
                {cooldown > 0 ? `Kirim ulang dalam ${cooldown}s` : "Belum dapat email? Kirim ulang"}
              </button>

              <div className="w-full border-t border-gray-100 mt-4 pt-4">
                <p className="text-xs text-gray-400">
                  Salah alamat email?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setError(null);
                    }}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Ganti email
                  </button>
                </p>
              </div>

              <Link
                href="/login"
                className="inline-block mt-6 text-sm text-gray-500 hover:text-[#0B1739] transition-colors"
              >
                ← Kembali ke Login
              </Link>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-[#0B1739]/5 text-[#0B1739] flex items-center justify-center mb-5">
                <MailIcon className="w-7 h-7" />
              </div>

              <h2 className="text-2xl font-bold text-[#0B1739] mb-2">
                Reset Password
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Masukkan email akun kamu, kami akan kirimkan tautan untuk
                membuat password baru.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <AuthInput
                  id="email"
                  name="email"
                  type="email"
                  label="Email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                />

                {error && <AuthErrorBanner message={error} />}

                <AuthSubmitButton loading={loading} loadingLabel="Mengirim...">
                  Kirim Tautan Reset
                </AuthSubmitButton>
              </form>

              <div className="flex items-start gap-2 bg-gray-50 rounded-lg px-3 py-2.5 mt-6">
                <span className="text-gray-400 mt-0.5">ⓘ</span>
                <p className="text-xs text-gray-500">
                  Tautan reset berlaku selama 60 menit demi keamanan akunmu.
                </p>
              </div>

              <p className="text-center text-sm text-gray-600 mt-6">
                Ingat password kamu?{" "}
                <Link href="/login" className="text-blue-600 font-medium hover:underline">
                  Masuk
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}