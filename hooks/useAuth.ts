"use client";

import { useAuth as useAuthContext } from "@/context/AuthContext";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  career_goal_id: number | null;
  education_background?: string | null;
  interest?: string | null;
  role: "user" | "mentor" | "admin";
  plan: "free" | "pro" | "career_mentor";       // tambahan
  plan_expires_at: string | null;
}

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

/**
 * Adapter tipis di atas AuthContext supaya komponen lama (ProtectedLayout,
 * AppHeader, dst) yang mengharapkan bentuk {status, user, clearSession}
 * tidak perlu ditulis ulang. "checking" sekarang berarti: sedang mencoba
 * silent-refresh lewat refresh_token cookie saat app pertama dibuka —
 * BUKAN lagi cek localStorage.
 */
export function useAuth() {
  const { user, isInitializing, setSession, clearSession } = useAuthContext();

  const status: AuthStatus = isInitializing
    ? "checking"
    : user
      ? "authenticated"
      : "unauthenticated";

  return { status, user: user as AuthUser | null, setSession, clearSession };
}