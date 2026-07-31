/**
 * Token disimpan di variabel module-level (in-memory), BUKAN localStorage.
 *
 * `epoch` adalah "nomor generasi" sesi — bertambah setiap kali token
 * berubah (login, logout, atau refresh berhasil). Dipakai untuk mendeteksi
 * request /refresh yang telat selesai (stale) setelah ada login/logout
 * baru terjadi di tengah request itu berjalan, supaya hasil basi tidak
 * menimpa sesi yang lebih baru.
 */

let currentToken: string | null = null;
let epoch = 0;

export function getToken(): string | null {
  return currentToken;
}

export function setToken(token: string | null): void {
  currentToken = token;
  epoch += 1;
}

export function getEpoch(): number {
  return epoch;
}