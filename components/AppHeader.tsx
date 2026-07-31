"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import api from "@/lib/api";
import { LogoMark } from "@/components/ui/Logo";
import { useAuth } from "@/hooks/useAuth";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/skill-map", label: "Skill Map" },
  { href: "/learning-path", label: "Learning Path" },
];

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { clearSession } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      // Minta backend revoke refresh_token cookie + access token saat
      // ini juga (bukan cuma dihapus di browser).
      await api.post("/logout");
    } catch {
      // Kalaupun request logout ke server gagal (misal access token sudah
      // expired), tetap lanjut bersihkan sesi lokal & redirect — jangan
      // bikin user terjebak nggak bisa keluar dari sesi yang rusak.
    } finally {
      clearSession();
      router.replace("/login");
    }
  }

  function renderLinks(className: string) {
    return NAV_LINKS.map((link) => {
      const isActive = pathname === link.href;
      return (
        <Link
          key={link.href}
          href={link.href}
          aria-current={isActive ? "page" : undefined}
          className={`${className} ${
            isActive ? "text-white font-semibold" : "text-white/60 hover:text-white"
          }`}
        >
          {link.label}
        </Link>
      );
    });
  }

  return (
    <header className="bg-[#0B1739] border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-md md:max-w-5xl xl:max-w-6xl mx-auto px-5 md:px-8 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <LogoMark size={24} />
          <span className="text-white font-bold tracking-wide text-xs">
            PATHSKILL
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden sm:flex items-center gap-4">
            {renderLinks("text-xs transition-colors")}
          </nav>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs border border-white/20 rounded-lg px-3 py-1.5 disabled:opacity-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            {loggingOut ? "..." : "Logout"}
          </button>
        </div>
      </div>

      {/* nav mobile - tampil di bawah bar utama karena layar sempit */}
      <nav className="sm:hidden flex items-center gap-4 px-5 pb-3 -mt-1 overflow-x-auto">
        {renderLinks("text-xs whitespace-nowrap transition-colors")}
      </nav>
    </header>
  );
}