"use client";

import { useEffect, useRef, useState } from "react";

export default function CosmicVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [canLoad, setCanLoad] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (window.matchMedia) {
      setPrefersReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setCanLoad(true);
        io.disconnect();
      }
    }, { rootMargin: "200px" });
    io.observe(el);
    // Fallback: if observer doesn't fire quickly (SEO prerender, hidden tab), load after short delay
    const t = setTimeout(() => setCanLoad(true), 1500);
    return () => {
      clearTimeout(t);
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    const playVideo = async () => {
      try {
        // Harden autoplay on mobile
        video.muted = true;
        video.setAttribute("muted", "");
        // @ts-expect-error playsInline property exists at runtime
        video.playsInline = true;
        video.setAttribute("playsinline", "");
        if (video.readyState < 2) {
          await new Promise<void>((resolve) => {
            const onReady = () => {
              video.removeEventListener("loadeddata", onReady);
              video.removeEventListener("canplay", onReady);
              resolve();
            };
            video.addEventListener("loadeddata", onReady, { once: true });
            video.addEventListener("canplay", onReady, { once: true });
            setTimeout(() => resolve(), 1500);
          });
        }
        await video.play();
        setIsPlaying(true);
      } catch {
        // Autoplay might be blocked; keep fallback visible
      }
    };

    const onError = () => setLoadError(true);
    const onStalled = () => setLoadError(true);
    const onWaiting = () => setIsPlaying(false);
    const onPlaying = () => setIsPlaying(true);
    video.addEventListener("error", onError);
    video.addEventListener("stalled", onStalled);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);

    playVideo();

    // If still not playing after 5s, mark error (keep CSS fallback visible)
    const t = setTimeout(() => {
      if (!isPlaying) setLoadError(true);
    }, 5000);

    return () => {
      clearTimeout(t);
      video.removeEventListener("error", onError);
      video.removeEventListener("stalled", onStalled);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
    };
  }, [canLoad, isPlaying]);

  const toggleMute = () => {
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
    <div ref={containerRef} className="fixed inset-0 -z-10 overflow-hidden">
      {/* Cosmic Video Background */}
      {canLoad && !loadError && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/window.svg"
          onError={() => {
            // Fallback to CSS animation if video fails to load
            console.log("Video failed to load, using CSS fallback");
          }}
        >
          {/* Try nuclear explosion first, fallback to big bang */}
          <source src="/nuclear-explosion.mp4" type="video/mp4" />
          <source src="/bigbang-intro.mp4" type="video/mp4" />
        </video>
      )}

      {/* CSS Fallback Cosmic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-hero-animated"></div>
        {/* Animated cosmic elements */}
        {!prefersReduced && (
          <div className="absolute inset-0">
            {/* Big Bang shockwaves */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-yellow-400/20 blur-[2px] animate-ping"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-orange-500/20 blur-sm animate-ping" style={{animationDelay:'0.2s'}}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-red-500/20 blur animate-ping" style={{animationDelay:'0.4s'}}></div>

            {/* Nebula glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-purple-500/20 to-transparent rounded-full animate-pulse-glow"></div>
            <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-gradient-radial from-blue-500/20 to-transparent rounded-full animate-pulse-glow" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-2/3 left-2/3 w-44 h-44 bg-gradient-radial from-pink-500/20 to-transparent rounded-full animate-pulse-glow" style={{animationDelay: '3s'}}></div>
          </div>
        )}
      </div>

      {/* Cosmic Audio */}
      <audio
        ref={audioRef}
        loop
        preload="metadata"
        muted={isMuted}
      >
        <source src="/nuclear-audio.mp3" type="audio/mpeg" />
        <source src="/bigbang-audio.mp3" type="audio/mpeg" />
      </audio>
      
      {/* Cosmic Overlay Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-purple-900/10 to-slate-900/20"></div>
      <div className="absolute inset-0 bg-hero-animated"></div>
      
      {/* Floating Cosmic Elements */}
      {!prefersReduced && (
        <>
          <div className="absolute top-20 left-10 w-4 h-4 bg-yellow-400 rounded-full animate-float opacity-60"></div>
          <div className="absolute top-40 right-20 w-2 h-2 bg-amber-500 rounded-full animate-float opacity-40" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-40 left-20 w-3 h-3 bg-orange-500 rounded-full animate-float opacity-50" style={{animationDelay: '4s'}}></div>
          <div className="absolute top-60 right-40 w-1 h-1 bg-yellow-300 rounded-full animate-sparkle"></div>
          <div className="absolute bottom-60 right-10 w-2 h-2 bg-purple-400 rounded-full animate-float opacity-30" style={{animationDelay: '6s'}}></div>
          <div className="absolute top-80 left-1/3 w-1 h-1 bg-blue-300 rounded-full animate-sparkle" style={{animationDelay: '3s'}}></div>
        </>
      )}

      {/* Audio Control */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 z-20 p-3 bg-slate-800/50 backdrop-blur-sm rounded-full border border-yellow-400/30 hover:bg-slate-700/50 transition-all duration-300 group"
        aria-label={isMuted ? "Unmute audio" : "Mute audio"}
      >
        {isMuted ? (
          <svg className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        )}
      </button>

      {/* Cosmic Loading Indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-yellow-400 text-sm">Loading cosmic experience...</p>
          </div>
        </div>
      )}
    </div>
  );
}
