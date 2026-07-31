"use client";

import { useId, useState } from "react";
import api from "@/lib/api";
import { SITE_CONFIG, buildWhatsAppLink } from "@/lib/site-config";
import {
  MessageCircle,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function KontakPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  const nameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const messageId = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");

    try {
      await api.post("/contact", form);

      setStatus("sent");
      setForm({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="bg-white">
      <div className="max-w-6xl mx-auto px-5 py-16 grid md:grid-cols-2 gap-12">
        {/* Informasi Kontak */}
        <div>
          <h1 className="text-[#0B1739] text-3xl font-bold mb-3">
            Hubungi Kami
          </h1>

          <p className="text-gray-500 mb-8">
            Ada pertanyaan soal paket, kerja sama kampus, atau butuh bantuan
            teknis? Chat langsung via WhatsApp untuk respons paling cepat.
          </p>

          <a
            href={buildWhatsAppLink(
              "Halo, saya ingin bertanya soal PathSkill."
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold px-6 py-3 rounded-xl mb-8 hover:bg-green-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
          >
            <MessageCircle
              className="w-5 h-5"
              aria-hidden="true"
            />
            Chat via WhatsApp
          </a>

          <div className="space-y-3 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <Mail
                className="w-4 h-4 text-gray-400 shrink-0"
                aria-hidden="true"
              />
              <span>
                <span className="font-semibold text-[#0B1739]">
                  Email:
                </span>{" "}
                {SITE_CONFIG.email}
              </span>
            </p>

            <p className="flex items-center gap-2">
              <MapPin
                className="w-4 h-4 text-gray-400 shrink-0"
                aria-hidden="true"
              />
              <span>
                <span className="font-semibold text-[#0B1739]">
                  Lokasi:
                </span>{" "}
                {SITE_CONFIG.address}
              </span>
            </p>
          </div>
        </div>

        {/* Form Kontak */}
        <div className="bg-gray-50 rounded-2xl p-6">
          <h2 className="font-bold text-[#0B1739] mb-4">
            Atau Kirim Pesan
          </h2>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            noValidate
          >
            <div>
              <label
                htmlFor={nameId}
                className="text-sm text-gray-700 block mb-1"
              >
                Nama
              </label>

              <input
                id={nameId}
                required
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B1739]"
              />
            </div>

            <div>
              <label
                htmlFor={emailId}
                className="text-sm text-gray-700 block mb-1"
              >
                Email
              </label>

              <input
                id={emailId}
                type="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B1739]"
              />
            </div>

            <div>
              <label
                htmlFor={phoneId}
                className="text-sm text-gray-700 block mb-1"
              >
                No. HP (opsional)
              </label>

              <input
                id={phoneId}
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B1739]"
              />
            </div>

            <div>
              <label
                htmlFor={messageId}
                className="text-sm text-gray-700 block mb-1"
              >
                Pesan
              </label>

              <textarea
                id={messageId}
                rows={4}
                required
                value={form.message}
                onChange={(e) =>
                  setForm({
                    ...form,
                    message: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B1739]"
              />
            </div>

            <div aria-live="polite">
              {status === "sent" && (
                <p className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2
                    className="w-4 h-4"
                    aria-hidden="true"
                  />
                  Pesan berhasil dikirim. Kami akan segera menghubungi Anda.
                </p>
              )}

              {status === "error" && (
                <p className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle
                    className="w-4 h-4"
                    aria-hidden="true"
                  />
                  Gagal mengirim pesan. Silakan coba lagi.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              aria-busy={status === "sending"}
              className="w-full bg-[#0B1739] text-white font-semibold py-3 rounded-xl hover:bg-[#0B1739]/90 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0B1739]"
            >
              {status === "sending"
                ? "Mengirim..."
                : "Kirim Pesan"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}