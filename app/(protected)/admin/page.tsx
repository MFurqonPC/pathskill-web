"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { AdminUserResult } from "@/types/admin";
import { Search, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

const PLAN_LABEL: Record<AdminUserResult["plan"], string> = {
  free: "Starter (Gratis)",
  pro: "Pro",
  career_mentor: "Career Mentor",
};

const PLAN_BADGE: Record<AdminUserResult["plan"], string> = {
  free: "bg-gray-100 text-gray-600",
  pro: "bg-blue-100 text-blue-700",
  career_mentor: "bg-purple-100 text-purple-700",
};

export default function AdminActivatePlanPage() {
  const router = useRouter();
  const { status, user: authUser } = useAuth();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminUserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<AdminUserResult | null>(null);
  const [plan, setPlan] = useState<AdminUserResult["plan"]>("pro");
  const [months, setMonths] = useState(1);
  const [activating, setActivating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activateError, setActivateError] = useState<string | null>(null);

  // Guard akses: cuma role admin yang boleh lihat halaman ini.
  // "checking" = masih silent-refresh via refresh_token cookie, tunggu dulu
  // sebelum memutuskan redirect, supaya admin asli tidak ke-lempar keluar
  // gara-gara timing loading, bukan karena memang bukan admin.
  useEffect(() => {
    if (status === "checking") return;

    if (status === "unauthenticated" || authUser?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [status, authUser, router]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setSearchError(null);
    setSuccessMessage(null);

    try {
      const res = await api.get<AdminUserResult[]>("/admin/users/search", {
        params: { q: query.trim() },
      });
      setResults(res.data);
    } catch (err: any) {
      setSearchError(
        err.response?.data?.message ?? "Gagal mencari user. Coba lagi."
      );
    } finally {
      setSearching(false);
    }
  }

  function selectUser(user: AdminUserResult) {
    setSelectedUser(user);
    setPlan(user.plan === "free" ? "pro" : user.plan);
    setMonths(1);
    setSuccessMessage(null);
    setActivateError(null);
  }

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;

    setActivating(true);
    setActivateError(null);
    setSuccessMessage(null);

    try {
      const res = await api.post(
        `/admin/users/${selectedUser.id}/activate-plan`,
        { plan, months }
      );
      setSuccessMessage(res.data.message);

      // Sinkronkan data user di kartu hasil pencarian & kartu terpilih
      const updated: AdminUserResult = res.data.user;
      setSelectedUser(updated);
      setResults((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
    } catch (err: any) {
      setActivateError(
        err.response?.data?.message ?? "Gagal mengaktivasi plan. Coba lagi."
      );
    } finally {
      setActivating(false);
    }
  }

  // Selama status auth belum jelas ATAU sudah jelas tapi bukan admin,
  // tampilkan loading — mencegah "flash" konten admin sekilas sebelum
  // useEffect di atas sempat redirect.
  if (status === "checking" || authUser?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0B1739] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white animate-spin" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1739] pb-16">
      <div className="max-w-md md:max-w-5xl xl:max-w-6xl mx-auto px-5 md:px-8 pt-10">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-purple-400" aria-hidden="true" />
          <h1 className="text-white text-2xl md:text-3xl font-bold">
            Aktivasi Plan User
          </h1>
        </div>
        <p className="text-white/60 text-sm mb-6">
          Cari user berdasarkan email/nama, lalu aktivasi plan setelah
          pembayaran manual dikonfirmasi.
        </p>

        <div className="md:grid md:grid-cols-3 md:gap-6 md:items-start">
          {/* Kolom kiri: search + hasil */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl p-5 mb-6">
              <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari email atau nama user..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#0B1739] focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="flex items-center gap-1.5 bg-[#0B1739] text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-50"
                >
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Search className="w-4 h-4" aria-hidden="true" />
                  )}
                  Cari
                </button>
              </form>

              {searchError && (
                <p className="text-red-600 text-sm mb-3">{searchError}</p>
              )}

              {results.length === 0 && !searching && (
                <p className="text-gray-400 text-sm">
                  Belum ada hasil. Coba cari user dulu.
                </p>
              )}

              <div className="space-y-2">
                {results.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => selectUser(user)}
                    className={`w-full text-left flex items-center justify-between border rounded-xl p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                      selectedUser?.id === user.id
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#0B1739]">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${PLAN_BADGE[user.plan]}`}
                    >
                      {PLAN_LABEL[user.plan]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Kolom kanan: form aktivasi */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl p-5 mb-6">
              <h2 className="font-bold text-[#0B1739] mb-3">
                {selectedUser ? "Aktivasi Plan" : "Pilih user dulu"}
              </h2>

              {!selectedUser && (
                <p className="text-gray-400 text-sm">
                  Klik salah satu hasil pencarian di sebelah kiri untuk
                  mengaktivasi plan-nya.
                </p>
              )}

              {selectedUser && (
                <form onSubmit={handleActivate} className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-[#0B1739]">
                      {selectedUser.name}
                    </p>
                    <p className="text-xs text-gray-400 mb-1">
                      {selectedUser.email}
                    </p>
                    <p className="text-xs text-gray-400">
                      Plan saat ini:{" "}
                      <span className="font-medium text-[#0B1739]">
                        {PLAN_LABEL[selectedUser.plan]}
                      </span>
                      {selectedUser.plan_expires_at && (
                        <>
                          {" "}
                          (s/d{" "}
                          {new Intl.DateTimeFormat("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(selectedUser.plan_expires_at))}
                          )
                        </>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Plan baru
                    </label>
                    <select
                      value={plan}
                      onChange={(e) =>
                        setPlan(e.target.value as AdminUserResult["plan"])
                      }
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#0B1739] focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="free">Starter (Gratis)</option>
                      <option value="pro">Pro</option>
                      <option value="career_mentor">Career Mentor</option>
                    </select>
                  </div>

                  {plan !== "free" && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Durasi (bulan)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={months}
                        onChange={(e) => setMonths(Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#0B1739] focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  )}

                  {activateError && (
                    <p className="text-red-600 text-sm">{activateError}</p>
                  )}

                  {successMessage && (
                    <p className="flex items-center gap-1.5 text-green-600 text-sm">
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      {successMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={activating}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50"
                  >
                    {activating ? "Mengaktivasi..." : "Aktivasi Plan"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}