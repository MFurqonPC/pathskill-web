"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/ui/Logo";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/layanan", label: "Layanan" },
  { href: "/tentang", label: "Tentang Kami" },
  { href: "/kontak", label: "Kontak" },
];

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Kunci scroll body saat menu mobile terbuka
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Tutup menu otomatis kalau pindah halaman (mis. lewat back/forward browser)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Border/shadow halus saat halaman di-scroll, biar navbar tidak "menyatu"
  // dengan konten hero yang warnanya sama-sama navy
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`bg-[#0B1739] sticky top-0 z-50 border-b transition-colors ${
        scrolled ? "border-white/10 shadow-lg shadow-black/20" : "border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <LogoMark size={28} />
          <span className="text-white font-bold tracking-wide text-sm">
            PATHSKILL
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative text-sm py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-sm ${
                  isActive
                    ? "text-white font-semibold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 rounded-full"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/learning-path"
            className="group inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1739] focus-visible:ring-blue-400"
          >
            Masuk App
            <ArrowRight
              className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`md:hidden bg-[#0B1739] border-t border-white/10 overflow-hidden transition-all duration-200 ${
          open ? "max-h-96 opacity-100 py-4" : "max-h-0 opacity-0 py-0"
        }`}
      >
        <div className="px-5 flex flex-col gap-4">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                tabIndex={open ? 0 : -1}
                className={`text-sm rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                  isActive ? "text-white font-semibold" : "text-white/80"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <hr className="border-white/10" />
          <Link
            href="/learning-path"
            tabIndex={open ? 0 : -1}
            className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            Masuk App
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}