// app/dashboard/layout.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) { router.replace("/login"); return; }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    (async () => {
      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
        });
        if (!res.ok) { localStorage.removeItem("token"); router.replace("/login"); return; }
        setReady(true);
      } catch (e: any) {
        if (e?.name !== "AbortError") { localStorage.removeItem("token"); router.replace("/login"); }
      }
    })();

    return () => ctrl.abort();
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-dvh relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-hero-animated" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-slate-200/40 dark:bg-grid-slate-800/30" />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-3xl glass-card ring-glow p-8">
            <div className="h-6 w-48 loading-shimmer rounded-md" />
            <div className="mt-3 h-4 w-80 loading-shimmer rounded-md" />
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
