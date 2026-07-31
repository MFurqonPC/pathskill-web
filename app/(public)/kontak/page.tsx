"use client";

import { useId, useState, useRef } from "react";
import api from "@/lib/api";
import { SITE_CONFIG, buildWhatsAppLink } from "@/lib/site-config";
import {
    MessageCircle,
    Mail,
    MapPin,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";

type FormData = {
    name: string;
    email: string;
    phone: string;
    message: string;
    website: string; // honeypot — harus tetap kosong
};

type FieldErrors = Partial<Record<keyof Omit<FormData, "website">, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{8,20}$/;

function validate(form: FormData): FieldErrors {
    const errors: FieldErrors = {};

    if (!form.name.trim()) {
        errors.name = "Nama wajib diisi.";
    } else if (form.name.trim().length < 2) {
        errors.name = "Nama terlalu pendek.";
    }

    if (!form.email.trim()) {
        errors.email = "Email wajib diisi.";
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
        errors.email = "Format email tidak valid.";
    }

    if (form.phone.trim() && !PHONE_REGEX.test(form.phone.trim())) {
        errors.phone = "Format no. HP tidak valid.";
    }

    if (!form.message.trim()) {
        errors.message = "Pesan tidak boleh kosong.";
    } else if (form.message.trim().length < 10) {
        errors.message = "Pesan minimal 10 karakter.";
    }

    return errors;
}

const initialForm: FormData = {
    name: "",
    email: "",
    phone: "",
    message: "",
    website: "",
};

export default function KontakPage() {
    const [form, setForm] = useState<FormData>(initialForm);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
        "idle",
    );
    const [errorMessage, setErrorMessage] = useState<string>("");
    const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const nameId = useId();
    const emailId = useId();
    const phoneId = useId();
    const messageId = useId();

    function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
        // hapus error field ini begitu user mulai memperbaiki
        if (key !== "website" && fieldErrors[key]) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[key as keyof FieldErrors];
                return next;
            });
        }
    }

    function scheduleStatusReset() {
        if (resetTimer.current) clearTimeout(resetTimer.current);
        resetTimer.current = setTimeout(() => {
            setStatus("idle");
        }, 5000);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // honeypot: bila terisi, diam-diam anggap sukses tanpa kirim apa pun
        if (form.website) {
            setForm(initialForm);
            setStatus("sent");
            scheduleStatusReset();
            return;
        }

        const errors = validate(form);
        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            setStatus("error");
            setErrorMessage("Periksa kembali data yang kamu isi.");
            return;
        }

        setStatus("sending");
        setErrorMessage("");

        try {
            await api.post("/contact", {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                message: form.message.trim(),
            });

            setStatus("sent");
            setForm(initialForm);
            setFieldErrors({});
            scheduleStatusReset();
        } catch (err: unknown) {
            setStatus("error");

            const apiMessage =
                err && typeof err === "object" && "response" in err
                    ? // @ts-expect-error — bentuk error tergantung implementasi axios/fetch wrapper
                      err.response?.data?.message
                    : undefined;

            if (apiMessage) {
                setErrorMessage(apiMessage);
            } else if (
                err &&
                typeof err === "object" &&
                "message" in err &&
                (err as { message?: string }).message === "Network Error"
            ) {
                setErrorMessage(
                    "Tidak bisa terhubung ke server. Periksa koneksi internetmu.",
                );
            } else {
                setErrorMessage("Gagal mengirim pesan. Silakan coba lagi.");
            }
        }
    }

    const inputBaseClass =
        "w-full border rounded-lg px-4 py-2.5 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B1739] transition-colors";

    function inputClass(hasError: boolean) {
        return `${inputBaseClass} ${
            hasError ? "border-red-400 focus:ring-red-400" : "border-gray-300"
        }`;
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
                        Ada pertanyaan soal paket, kerja sama kampus, atau butuh
                        bantuan teknis? Chat langsung via WhatsApp untuk respons
                        paling cepat.
                    </p>

                    <a
                        href={buildWhatsAppLink(
                            "Halo, saya ingin bertanya soal PathSkill.",
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold px-6 py-3 rounded-xl mb-8 hover:bg-green-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500"
                    >
                        <MessageCircle className="w-5 h-5" aria-hidden="true" />
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
                        {/* Honeypot — disembunyikan dari pengguna asli, hanya bot yang mengisi */}
                        <div className="hidden" aria-hidden="true">
                            <label htmlFor="website">Website</label>
                            <input
                                id="website"
                                name="website"
                                type="text"
                                tabIndex={-1}
                                autoComplete="off"
                                value={form.website}
                                onChange={(e) =>
                                    updateField("website", e.target.value)
                                }
                            />
                        </div>

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
                                aria-invalid={!!fieldErrors.name}
                                aria-describedby={
                                    fieldErrors.name
                                        ? `${nameId}-error`
                                        : undefined
                                }
                                value={form.name}
                                onChange={(e) =>
                                    updateField("name", e.target.value)
                                }
                                className={inputClass(!!fieldErrors.name)}
                            />
                            {fieldErrors.name && (
                                <p
                                    id={`${nameId}-error`}
                                    className="text-red-500 text-xs mt-1"
                                >
                                    {fieldErrors.name}
                                </p>
                            )}
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
                                aria-invalid={!!fieldErrors.email}
                                aria-describedby={
                                    fieldErrors.email
                                        ? `${emailId}-error`
                                        : undefined
                                }
                                value={form.email}
                                onChange={(e) =>
                                    updateField("email", e.target.value)
                                }
                                className={inputClass(!!fieldErrors.email)}
                            />
                            {fieldErrors.email && (
                                <p
                                    id={`${emailId}-error`}
                                    className="text-red-500 text-xs mt-1"
                                >
                                    {fieldErrors.email}
                                </p>
                            )}
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
                                aria-invalid={!!fieldErrors.phone}
                                aria-describedby={
                                    fieldErrors.phone
                                        ? `${phoneId}-error`
                                        : undefined
                                }
                                value={form.phone}
                                onChange={(e) =>
                                    updateField("phone", e.target.value)
                                }
                                className={inputClass(!!fieldErrors.phone)}
                            />
                            {fieldErrors.phone && (
                                <p
                                    id={`${phoneId}-error`}
                                    className="text-red-500 text-xs mt-1"
                                >
                                    {fieldErrors.phone}
                                </p>
                            )}
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
                                aria-invalid={!!fieldErrors.message}
                                aria-describedby={
                                    fieldErrors.message
                                        ? `${messageId}-error`
                                        : undefined
                                }
                                value={form.message}
                                onChange={(e) =>
                                    updateField("message", e.target.value)
                                }
                                className={inputClass(!!fieldErrors.message)}
                            />
                            {fieldErrors.message && (
                                <p
                                    id={`${messageId}-error`}
                                    className="text-red-500 text-xs mt-1"
                                >
                                    {fieldErrors.message}
                                </p>
                            )}
                        </div>

                        <div aria-live="polite">
                            {status === "sent" && (
                                <p className="flex items-center gap-2 text-green-600 text-sm">
                                    <CheckCircle2
                                        className="w-4 h-4"
                                        aria-hidden="true"
                                    />
                                    Pesan berhasil dikirim. Kami akan segera
                                    menghubungi Anda.
                                </p>
                            )}

                            {status === "error" && (
                                <p className="flex items-center gap-2 text-red-500 text-sm">
                                    <AlertCircle
                                        className="w-4 h-4"
                                        aria-hidden="true"
                                    />
                                    {errorMessage ||
                                        "Gagal mengirim pesan. Silakan coba lagi."}
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
