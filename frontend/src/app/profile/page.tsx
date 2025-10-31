// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Me = { id: string; email: string; name: string; avatarUrl: string | null };

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headers = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  useEffect(() => {
    (async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) { router.replace("/login"); return; }
      try {
        const res = await fetch(`${API}/auth/me`, { headers: headers() });
        if (!res.ok) { localStorage.removeItem("token"); router.replace("/login"); return; }
        const data = await res.json();
        setMe(data.user);
        setName(data.user.name || "");
        setAvatarUrl(data.user.avatarUrl || "");
      } catch (e: any) {
        setError(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`${API}/auth/me`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ name, avatarUrl: avatarUrl || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update profile");
      setMe(data.user);
    } catch (e: any) {
      setError(e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl glass-card ring-glow p-8">
          <div className="h-6 w-48 loading-shimmer rounded-md" />
          <div className="mt-3 h-4 w-80 loading-shimmer rounded-md" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <section className="rounded-3xl p-1 border-gradient">
        <div className="rounded-3xl glass-card ring-glow p-6">
          <h1 className="text-2xl font-semibold">Your Profile</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Update your name and avatar.</p>

          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <div className="aspect-square w-32 overflow-hidden rounded-2xl border-gradient glass-card">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">No avatar</div>
                )}
              </div>
            </div>
            <div className="sm:col-span-2 grid gap-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium">Avatar URL</label>
                <input
                  className="input mt-1"
                  placeholder="https://..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">Paste a direct image URL (JPG/PNG/SVG/WebP).</p>
              </div>
              {error && <div className="alert-error">{error}</div>}
              <div className="flex gap-2">
                <button onClick={save} disabled={saving || name.trim().length < 2} className={`btn-primary ${saving ? "opacity-70" : ""}`}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => { setName(me?.name || ""); setAvatarUrl(me?.avatarUrl || ""); }}
                >
                  Reset
                </button>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Email: <span className="badge">{me?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
