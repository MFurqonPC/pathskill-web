import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";
import { LogoMark } from "@/components/ui/Logo";

export default function PublicFooter() {
  return (
    <footer className="bg-[#0B1739] border-t border-white/10 relative">
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 opacity-60"
      />

      <div className="max-w-6xl mx-auto px-5 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 mb-3 w-fit rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <LogoMark size={24} />
            <span className="text-white font-bold tracking-wide text-sm">
              PATHSKILL
            </span>
          </Link>

          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            Bandingkan skill kamu dengan kebutuhan industri, dan ikuti jalur
            belajar yang dipersonalisasi AI untuk siap kerja di bidang IT.
          </p>
        </div>

        <div>
          <p className="text-white text-sm font-semibold mb-3">Navigasi</p>

          <ul className="space-y-2 text-sm text-white/70">
            <li>
              <Link
                href="/layanan"
                className="hover:text-white transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                Layanan
              </Link>
            </li>

            <li>
              <Link
                href="/tentang"
                className="hover:text-white transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                Tentang Kami
              </Link>
            </li>

            <li>
              <Link
                href="/kontak"
                className="hover:text-white transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                Kontak
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-white text-sm font-semibold mb-3">
            Hubungi Kami
          </p>

          <ul className="space-y-2 text-sm text-white/70">
            <li>
              <a
                href={`mailto:${SITE_CONFIG.email}`}
                className="hover:text-white transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                {SITE_CONFIG.email}
              </a>
            </li>

            <li>{SITE_CONFIG.address}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-white/40 text-xs">
        © {new Date().getFullYear()} {SITE_CONFIG.businessName}. Semua hak
        dilindungi.
      </div>
    </footer>
  );
}