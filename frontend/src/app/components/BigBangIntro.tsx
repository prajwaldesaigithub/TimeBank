"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function BigBangIntro() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [progress, setProgress] = useState(0);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (window.matchMedia) {
      setPrefersReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, []);

  useEffect(() => {
    // Always play on load
    setIsPlaying(true);
    setTimeout(() => setShowSkip(true), 800);

    // Animation phases
    const phases = [
      { duration: 2000, phase: 1 }, // Big Bang explosion
      { duration: 2000, phase: 2 }, // Galaxy formation
      { duration: 2000, phase: 3 }, // Stars appearing
      { duration: 2000, phase: 4 }, // Title reveal
    ];

    let currentPhase = 0;
    let totalProgress = 0;

    const phaseInterval = setInterval(() => {
      if (currentPhase < phases.length) {
        setAnimationPhase(phases[currentPhase].phase);
        currentPhase++;
      }
    }, 2000);

    // Progress animation
    const progressInterval = setInterval(() => {
      totalProgress += 1;
      setProgress(totalProgress);
      
      if (totalProgress >= 100) {
        clearInterval(progressInterval);
        clearInterval(phaseInterval);
        setTimeout(() => {
          router.push("/home");
        }, 300);
      }
    }, 80); // 8 seconds total

    return () => {
      clearInterval(progressInterval);
      clearInterval(phaseInterval);
    };
  }, [router]);

  const skipIntro = () => {
    router.push("/home");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* Big Bang Video Background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        playsInline
        preload="metadata"
        poster="/window.svg"
      >
        <source src="/bigbang-intro.mp4" type="video/mp4" />
      </video>
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-purple-900/20 to-black/80">
        {/* Phase 1: Big Bang Explosion */}
        {animationPhase >= 1 && (
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-yellow-400/20 rounded-full animate-ping transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-500/30 rounded-full animate-ping transform -translate-x-1/2 -translate-y-1/2" style={{animationDelay: '0.3s'}}></div>
            <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-red-500/40 rounded-full animate-ping transform -translate-x-1/2 -translate-y-1/2" style={{animationDelay: '0.6s'}}></div>
          </div>
        )}

        {/* Phase 2: Galaxy Formation */}
        {animationPhase >= 2 && (
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Phase 3: Stars and Nebula */}
        {animationPhase >= 3 && (
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-blue-500/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-3/4 left-3/4 w-20 h-20 bg-pink-500/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>
        )}

        {/* Phase 4: Title Reveal */}
        {animationPhase >= 4 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center animate-fade-in">
              <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-4 animate-pulse">
                TimeBank
              </h1>
              <p className="text-xl text-slate-300 animate-fade-in">
                Where the universe of time begins...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
        <div 
          className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Skip Button */}
      {showSkip && (
        <button
          onClick={skipIntro}
          className="absolute top-4 right-4 z-20 px-6 py-3 bg-slate-800/50 backdrop-blur-sm rounded-full border border-yellow-400/30 hover:bg-slate-700/50 transition-all duration-300 text-yellow-400 hover:text-yellow-300 font-semibold"
        >
          Skip Intro
        </button>
      )}

      {/* Cosmic Particles */}
      {!prefersReduced && (
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-white rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
