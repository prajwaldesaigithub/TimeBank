"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function LandingHero() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden">

      {/* Animated Planets */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large Planet */}
        <div className="absolute top-20 right-20 w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/20 blur-xl animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute bottom-40 left-32 w-24 h-24 rounded-full bg-gradient-to-br from-pink-500/30 to-red-500/20 blur-lg animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400/25 to-orange-500/15 blur-md animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-20 right-1/3 w-20 h-20 rounded-full bg-gradient-to-br from-green-400/25 to-emerald-500/15 blur-lg animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-24 flex min-h-[100dvh] items-center relative z-10">
        <div className="max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-5xl md:text-7xl font-bold tracking-tight"
          >
            <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(234,179,8,0.25)]">
              TimeBank
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-4 text-lg md:text-xl text-slate-200"
          >
            Exchange Time. Build Connections. Empower Skills.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="mt-10 flex items-center gap-4"
          >
            <Link
              href="/login"
              className="btn-primary rounded-xl px-6 py-3 text-white shadow-lg transition-all duration-300 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:shadow-purple-500/30"
            >
              Enter App
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


