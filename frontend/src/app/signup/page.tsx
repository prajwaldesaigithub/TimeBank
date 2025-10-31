// app/signup/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(score, 5);
}

export default function SignupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const pwScore = useMemo(() => scorePassword(pw), [pw]);
  const pwStrongEnough = pw.length >= 6 && pwScore >= 3 && pw === pw2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Name is required.");
    if (!emailValid) return setError("Please enter a valid email.");
    if (!pwStrongEnough) return setError("Use a stronger password and confirm it.");
    if (!agree) return setError("Please agree to the Terms.");

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, password: pw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Signup failed.");
        return;
      }
      localStorage.setItem("token", data.token);
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
              <h1 className="text-2xl font-semibold">Create your account</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Start exchanging time credits.</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="name" className="block text-sm font-medium">Name</label>
                <input id="name" type="text" className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium">Email</label>
                <input id="email" type="email" className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} required aria-invalid={!emailValid && email.length > 0} />
                {!emailValid && email.length > 0 && <p className="mt-1 text-xs text-rose-600">Invalid email format.</p>}
              </div>

              <div>
                <label htmlFor="pw" className="block text-sm font-medium">Password</label>
                <div className="relative mt-1">
                  <input
                    id="pw"
                    type={show ? "text" : "password"}
                    className="input pr-24"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    onKeyUp={(e) => setCaps(e.getModifierState?.("CapsLock") || false)}
                    required
                    minLength={6}
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center gap-2">
                    {caps && pw && <span className="text-[11px] text-amber-600">Caps On</span>}
                    <button type="button" onClick={() => setShow((s) => !s)} className="btn-ghost px-2 py-1 text-xs">
                      {show ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      pwScore <= 2 ? "bg-rose-500 w-1/5" :
                      pwScore === 3 ? "bg-amber-500 w-2/5" :
                      pwScore === 4 ? "bg-emerald-500 w-3/5" :
                      "bg-emerald-600 w-4/5"
                    }`}
                    style={{ width: `${Math.max(20, pwScore * 20)}%` }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="pw2" className="block text-sm font-medium">Confirm password</label>
                <input id="pw2" type={show ? "text" : "password"} className="input mt-1" value={pw2} onChange={(e) => setPw2(e.target.value)} required minLength={6} />
                {pw2.length > 0 && pw !== pw2 && <p className="mt-1 text-xs text-rose-600">Passwords do not match.</p>}
              </div>

              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                I agree to the <a className="underline underline-offset-4" href="/terms">Terms</a> and <a className="underline underline-offset-4" href="/privacy">Privacy</a>.
              </label>

              {error && <div className="alert-error">{error}</div>}

              <button type="submit" disabled={loading || !name || !emailValid || !pwStrongEnough || !agree} className={`w-full btn-primary ${loading ? "opacity-70" : ""}`}>
                {loading ? "Creating…" : "Create account"}
              </button>

              <div className="text-center text-sm text-slate-600 dark:text-slate-300">
                Already have an account? <Link href="/login" className="underline underline-offset-4">Sign in</Link>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
