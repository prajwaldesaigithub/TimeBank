"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`${API}/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed. The token may be invalid or expired.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Network error. Please try again.");
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-dvh relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-hero-animated" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-slate-200/40 dark:bg-grid-slate-800/30" />
      <main className="mx-auto max-w-md px-4 py-12 flex items-center min-h-dvh">
        <section className="rounded-3xl p-1 border-gradient w-full">
          <div className="glass-card ring-glow rounded-3xl p-8 text-center">
            {status === "loading" && (
              <>
                <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
                <h1 className="text-2xl font-semibold mb-2">Verifying your email...</h1>
                <p className="text-slate-600 dark:text-slate-300">Please wait while we verify your email address.</p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold mb-2 text-green-600 dark:text-green-400">Email Verified!</h1>
                <p className="text-slate-600 dark:text-slate-300 mb-4">{message}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Redirecting to login...</p>
                <Link href="/login" className="mt-4 inline-block btn-primary">
                  Go to Login
                </Link>
              </>
            )}

            {status === "error" && (
              <>
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold mb-2 text-red-600 dark:text-red-400">Verification Failed</h1>
                <p className="text-slate-600 dark:text-slate-300 mb-4">{message}</p>
                <div className="space-y-2">
                  <Link href="/login" className="block btn-primary">
                    Go to Login
                  </Link>
                  <Link href="/signup" className="block btn-ghost">
                    Sign Up Again
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

