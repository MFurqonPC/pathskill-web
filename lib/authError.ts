import { AxiosError } from "axios";

/**
 * Menerjemahkan error dari API auth (login, register, refresh, dll)
 * menjadi pesan yang bisa langsung ditampilkan ke user.
 *
 * Menangani:
 * - Error validasi Laravel (422, format { message, errors: {field: [msg]} })
 * - Error umum dengan { message } dari backend
 * - Status code umum (401, 403, 404, 429, 5xx)
 * - Kegagalan jaringan (tidak ada response sama sekali)
 */
export function getAuthErrorMessage(
  error: unknown,
  fallbackMessage = "Terjadi kesalahan. Silakan coba lagi."
): string {
  const err = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;

  // Tidak ada response sama sekali → masalah jaringan / server down
  if (!err?.response) {
    return "Tidak bisa terhubung ke server. Periksa koneksi internet kamu dan coba lagi.";
  }


  const { status, data } = err.response;

  // Error validasi Laravel (422) — ambil pesan pertama dari field pertama
  if (status === 422 && data?.errors) {
    const firstField = Object.keys(data.errors)[0];
    const firstMessage = firstField ? data.errors[firstField]?.[0] : undefined;
    if (firstMessage) return firstMessage;
  }

  // Backend mengirim pesan spesifik
  if (data?.message) {
    return data.message;
  }

  // Fallback berdasarkan status code
  switch (status) {
    case 401:
      return "Email atau kata sandi salah.";
    case 403:
      return "Kamu tidak punya akses untuk melakukan tindakan ini.";
    case 404:
      return "Data yang diminta tidak ditemukan.";
    case 409:
      return "Email sudah terdaftar. Coba masuk atau gunakan email lain.";
    case 429:
      return "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.";
    default:
      if (status >= 500) {
        return "Terjadi kesalahan pada server. Coba lagi beberapa saat lagi.";
      }
      return fallbackMessage;
  }
}