"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { LogoMark } from "@/components/ui/Logo";
import { AuthInput, AuthErrorBanner, AuthSubmitButton } from "@/components/ui/AuthField";
import { getAuthErrorMessage } from "@/lib/authError";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const linkInvalid = !token || !email;

  function validate(): string | null {
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
      await api.post("/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, "Gagal reset password. Coba lagi."));
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
            Atur Ulang Password
          </h1>
          <p className="text-white/70 text-sm md:text-base">
            Buat password baru untuk akunmu
          </p>
        </div>
      </div>

      <div className="bg-white rounded-t-3xl md:rounded-none flex-1 md:flex-none px-6 pt-8 pb-10 md:w-1/2 md:min-h-screen md:flex md:items-center md:justify-center md:px-16 md:py-0">
        <div className="max-w-md w-full mx-auto">
          {linkInvalid ? (
            <div>
              <h2 className="text-2xl font-bold text-[#0B1739] mb-2">
                Tautan Tidak Valid
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Tautan reset password ini tidak lengkap atau sudah tidak
                berlaku. Minta tautan baru lewat halaman lupa password.
              </p>
              <Link
                href="/forgot-password"
                className="inline-block text-sm text-blue-600 font-medium hover:underline"
              >
                Minta Tautan Baru
              </Link>
            </div>
          ) : done ? (
            <div>
              <h2 className="text-2xl font-bold text-[#0B1739] mb-2">
                Password Diperbarui
              </h2>
              <p className="text-sm text-gray-500">
                Password kamu berhasil diganti. Mengalihkan ke halaman
                login...
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-[#0B1739] mb-2">
                Atur Ulang Password
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Masukkan password baru untuk{" "}
                <span className="font-medium text-[#0B1739]">{email}</span>.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <AuthInput
                  id="password"
                  name="password"
                  type="password"
                  label="Password Baru"
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
                  label="Konfirmasi Password Baru"
                  autoComplete="new-password"
                  required
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Ulangi password baru"
                />

                {error && <AuthErrorBanner message={error} />}

                <AuthSubmitButton loading={loading} loadingLabel="Memproses...">
                  Simpan Password Baru
                </AuthSubmitButton>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}