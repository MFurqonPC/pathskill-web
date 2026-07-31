import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getToken, setToken, getEpoch } from "@/lib/token-store";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
  // WAJIB true — supaya refresh_token httpOnly cookie ikut terkirim
  // dan diterima meskipun frontend & backend beda port/origin.
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

// Instance terpisah TANPA interceptor apapun, khusus untuk panggil
// /refresh. Kalau pakai instance `api` yang sama, response interceptor
// di bawah bisa memicu pemanggilan /refresh dari dalam dirinya sendiri
// (infinite loop) kalau /refresh juga pernah balas 401.
const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

interface RefreshResponse {
  token: string;
  user: Record<string, unknown>;
}

let onRefreshSuccess: ((token: string, user: Record<string, unknown>) => void) | null = null;
let onRefreshFailure: (() => void) | null = null;

/**
 * Dipanggil sekali oleh AuthContext untuk menyambungkan hasil refresh
 * balik ke state React (supaya `user` di context ikut ter-update).
 */
export function registerAuthCallbacks(
  onSuccess: (token: string, user: Record<string, unknown>) => void,
  onFailure: () => void
) {
  onRefreshSuccess = onSuccess;
  onRefreshFailure = onFailure;
}

let refreshPromise: Promise<string | null> | null = null;

/**
 * Tukar refresh_token cookie jadi access token baru. Kalau ada beberapa
 * request yang sama-sama kena 401 di waktu yang berdekatan, semuanya
 * "menumpang" ke satu request /refresh yang sama (bukan masing-masing
 * memanggil /refresh sendiri-sendiri).
 */
async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    // Catat generasi sesi SEBELUM request jalan. Kalau pas request ini
    // selesai ternyata sudah ada login/logout baru (epoch berubah),
    // berarti hasil request ini sudah basi — jangan diterapkan, supaya
    // tidak menimpa sesi yang lebih baru dengan hasil yang telat datang.
    const startEpoch = getEpoch();

    refreshPromise = refreshClient
      .post<RefreshResponse>("/refresh")
      .then((res) => {
        if (getEpoch() !== startEpoch) {
          return getToken(); // basi, abaikan, pakai token sesi terbaru saja
        }
        setToken(res.data.token);
        onRefreshSuccess?.(res.data.token, res.data.user);
        return res.data.token;
      })
      .catch(() => {
        if (getEpoch() !== startEpoch) {
          return getToken(); // basi, jangan sampai logout-kan sesi baru
        }
        setToken(null);
        onRefreshFailure?.();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    const is401 = error.response?.status === 401;
    const alreadyRetried = originalRequest?._retried;

    if (is401 && originalRequest && !alreadyRetried) {
      originalRequest._retried = true;
      const newToken = await refreshAccessToken();

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export { refreshAccessToken };
export default api;