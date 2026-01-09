// app/dashboard/layout.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeaderLogo from "../components/DashboardHeaderLogo";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    (async () => {
      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
        });
        if (!res.ok) {
          localStorage.removeItem("token");
          router.replace("/login");
          return;
        }
        setReady(true);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          localStorage.removeItem("token");
          router.replace("/login");
        }
      }
    })();

    return () => ctrl.abort();
  }, [router]);

  // Simple loader while checking session; intro video is handled globally in AppLoader
  if (!ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-slate-600 border-t-sky-400 animate-spin" />
          <p className="text-sm text-slate-300">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardHeaderLogo />
      {children}
    </>
  );
}
