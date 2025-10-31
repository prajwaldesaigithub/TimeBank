"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LandingHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [canLoad, setCanLoad] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCanLoad(true), 400);
    return () => clearTimeout(t);
  }, []);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
    if (!audio.muted) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      {/* Nuclear video background with fallback */}
      {canLoad && (
        <video
          ref={videoRef}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/window.svg"
        >
          <source src="/nuclear-explosion.mp4" type="video/mp4" />
          <source src="/bigbang-intro.mp4" type="video/mp4" />
        </video>
      )}

      {/* Ambient audio (muted by default) */}
      <audio ref={audioRef} loop preload="metadata" muted={isMuted}>
        <source src="/nuclear-audio.mp3" type="audio/mpeg" />
        <source src="/bigbang-audio.mp3" type="audio/mpeg" />
      </audio>

      {/* Overlay for readability */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      {/* Content */}
      <div className="container mx-auto px-6 py-24 flex min-h-[100dvh] items-center">
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
              className="rounded-xl px-6 py-3 text-white shadow-lg transition-all duration-300 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:shadow-purple-500/30"
            >
              Enter App
            </Link>

            <button
              onClick={toggleAudio}
              className="rounded-xl px-4 py-3 border border-yellow-400/30 bg-slate-900/40 backdrop-blur-md text-yellow-300 hover:bg-slate-800/60 transition-all"
              aria-label={isMuted ? "Unmute ambient audio" : "Mute ambient audio"}
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


