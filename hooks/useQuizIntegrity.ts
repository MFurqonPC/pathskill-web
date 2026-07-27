"use client";

import { useEffect, useRef } from "react";
import api from "@/lib/api";

/**
 * Gabungan: peringatan close/refresh tab, deteksi tab-switch,
 * dan disable copy-paste/klik-kanan — khusus dipakai di halaman quiz aktif.
 */
export function useQuizIntegrity(careerId: string, isWarmup: boolean, active: boolean) {
  const switchCountRef = useRef(0);

  // 1. Peringatan sebelum nutup tab / refresh
  useEffect(() => {
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);

  // 2. Deteksi tab-switch
  useEffect(() => {
    if (!active) return;
    const handler = () => {
      if (document.visibilityState === "hidden") {
        switchCountRef.current += 1;
        const baseUrl = api.defaults.baseURL ?? "";
        const token = localStorage.getItem("pathskill_token");

        // Gunakan fetch dengan keepalive agar bisa bawa Bearer Token
        fetch(`${baseUrl}/careers/${careerId}/verification-quiz/log-tab-switch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ is_warmup: isWarmup }),
          keepalive: true,
        }).catch(() => {}); // catch agar tidak throw error ke console jika gagal
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [active, careerId, isWarmup]);

  // 3. Disable copy-paste & klik kanan
  useEffect(() => {
    if (!active) return;
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);

    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
    };
  }, [active]);
}