// app/components/Header.tsx
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setAuthed(!!token);
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    setAuthed(false);
    router.replace("/login");
  };

  return (
    <header className="mx-auto max-w-6xl px-4 pt-6">
      <div className="rounded-2xl glass-card border-gradient p-3 flex items-center justify-between">
        <Link href="/" className="text-sm font-medium">
          <span className="text-gradient-primary">TimeBank</span>
        </Link>
        <nav className="flex items-center gap-2">
          {!authed ? (
            <>
              <Link href="/login" className="btn-ghost">Login</Link>
              <Link href="/signup" className="btn-primary">Sign up</Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="btn-ghost">Dashboard</Link>
              <Link href="/directory" className="btn-ghost">Directory</Link>
              <Link href="/requests" className="btn-ghost">Requests</Link>
              <Link href="/history" className="btn-ghost">History</Link>
              <Link href="/notifications" className="btn-ghost">Notifications</Link>
              <Link href="/profile" className="btn-ghost">Profile</Link>
              <button onClick={logout} className="btn-ghost" aria-label="Sign out">Logout</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
