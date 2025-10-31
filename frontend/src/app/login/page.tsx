// app/login/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setChecking(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          router.replace("/dashboard");
        } else {
          localStorage.removeItem("token");
          setChecking(false);
        }
      } catch {
        localStorage.removeItem("token");
        setChecking(false);
      }
    })();
  }, [router]);

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!emailValid) return setError("Please enter a valid email.");
    if (!password) return setError("Password is required.");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Login failed.");
        return;
      }
      localStorage.setItem("token", data.token);
      if (remember) localStorage.setItem("rememberedEmail", email);
      router.replace("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <main className="mx-auto max-w-md px-4 py-10">Checking session…</main>;
  }

  return (
    <div className="min-h-dvh relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-hero-animated" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-slate-200/40 dark:bg-grid-slate-800/30" />
      <main className="mx-auto max-w-md px-4 py-12">
        <section className="rounded-3xl p-1 border-gradient">
          <div className="glass-card ring-glow rounded-3xl p-6">
            <header className="mb-6 text-center">
              <h1 className="text-2xl font-semibold">Welcome back</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Sign in to continue.</p>
            </header>

            <form id="login-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium">Email</label>
                <input
                  id="email"
                  type="email"
                  className="input mt-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyUp={(e) => setCaps(e.getModifierState?.("CapsLock") || false)}
                  required
                  aria-invalid={!emailValid && email.length > 0}
                />
                {!emailValid && email.length > 0 && (
                  <p className="mt-1 text-xs text-rose-600">Invalid email format.</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium">Password</label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    type={show ? "text" : "password"}
                    className="input pr-24"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={(e) => setCaps(e.getModifierState?.("CapsLock") || false)}
                    required
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center gap-2">
                    {caps && password && <span className="text-[11px] text-amber-600">Caps On</span>}
                    <button type="button" onClick={() => setShow((s) => !s)} className="btn-ghost px-2 py-1 text-xs">
                      {show ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  Remember me
                </label>
                <Link href="/forgot" className="text-sm underline underline-offset-4">Forgot password?</Link>
              </div>

              {error && <div className="alert-error">{error}</div>}

              <button type="submit" disabled={loading || !emailValid || !password} className={`w-full btn-primary ${loading ? "opacity-70" : ""}`}>
                {loading ? "Signing in…" : "Sign in"}
              </button>

              <div className="text-center text-sm text-slate-600 dark:text-slate-300">
                Don’t have an account? <Link href="/signup" className="underline underline-offset-4">Create one</Link>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
