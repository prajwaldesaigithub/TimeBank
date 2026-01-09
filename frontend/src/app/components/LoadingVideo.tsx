"use client";

import { useEffect, useRef, useState } from "react";

interface LoadingVideoProps {
  onComplete?: () => void;
  videoPath?: string;
}

export default function LoadingVideo({ onComplete, videoPath = "/bigbang-intro.mp4" }: LoadingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const playAttemptedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set volume to max
    video.volume = 1.0;

    // Safety timeout: If video doesn't complete in 30 seconds, skip it
    timeoutRef.current = setTimeout(() => {
      console.warn("Video timeout - skipping video");
      setIsCompleted(true);
      if (onComplete) {
        onComplete();
      }
    }, 30000); // 30 second timeout

    // Function to attempt playing the video
    const attemptPlay = async () => {
      if (playAttemptedRef.current) return;
      playAttemptedRef.current = true;

      try {
        await video.play();
        setShowPlayButton(false);
        console.log("Video playing successfully");
      } catch (error: any) {
        console.log("Autoplay blocked, showing play button:", error.name);
        setShowPlayButton(true);
        playAttemptedRef.current = false; // Allow retry on click
      }
    };

    // Handle when video can play
    const handleCanPlay = () => {
      if (!playAttemptedRef.current) {
        attemptPlay();
      }
    };

    // Handle when video metadata is loaded
    const handleLoadedMetadata = () => {
      if (!playAttemptedRef.current) {
        attemptPlay();
      }
    };

    // Handle video ended
    const handleEnded = () => {
      console.log("Video ended - calling onComplete");
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsCompleted(true);
      if (onComplete) {
        // Call immediately to ensure app renders
        onComplete();
      } else {
        console.warn("onComplete callback not provided");
      }
    };

    // Handle play event
    const handlePlay = () => {
      setShowPlayButton(false);
      console.log("Video started playing");
    };

    // Handle errors
    const handleError = (e: Event) => {
      const videoElement = e.target as HTMLVideoElement;
      const error = videoElement.error;
      console.error("Video error:", {
        code: error?.code,
        message: error?.message,
        networkState: videoElement.networkState,
        readyState: videoElement.readyState,
        src: videoElement.src
      });
      setVideoError(true);
      setShowPlayButton(true);
      playAttemptedRef.current = false;
      
      // If video fails to load, auto-complete after 3 seconds
      setTimeout(() => {
        console.log("Video failed to load - auto-completing");
        setIsCompleted(true);
        if (onComplete) {
          onComplete();
        }
      }, 3000);
    };

    // Add event listeners
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("canplaythrough", handleCanPlay);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("play", handlePlay);
    video.addEventListener("error", handleError);

    // Try to play immediately if video is already loaded
    if (video.readyState >= 3) {
      attemptPlay();
    }

    // Fallback: Auto-complete after video duration + buffer (in case ended event doesn't fire)
    const progressInterval = setInterval(() => {
      const currentVideo = videoRef.current;
      if (currentVideo && currentVideo.readyState >= 2 && currentVideo.duration) {
        if (currentVideo.currentTime >= currentVideo.duration - 0.1) {
          console.log("Video completed via fallback check");
          clearInterval(progressInterval);
          handleEnded();
        }
      }
    }, 500);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearInterval(progressInterval);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("canplaythrough", handleCanPlay);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("error", handleError);
    };
  }, [onComplete]);

  const handlePlayClick = async () => {
    const video = videoRef.current;
    if (video) {
      try {
        video.volume = 1.0;
        playAttemptedRef.current = true;
        await video.play();
        setShowPlayButton(false);
        console.log("Video started via click");
      } catch (error) {
        console.error("Failed to play video on click:", error);
        setShowPlayButton(true);
      }
    }
  };

  // Skip button handler
  const handleSkip = () => {
    console.log("Video skipped by user");
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsCompleted(true);
    if (onComplete) {
      onComplete();
    }
  };

  // Don't render if completed
  if (isCompleted) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black overflow-hidden"
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <video
        ref={videoRef}
        playsInline
        autoPlay
        loop={false}
        preload="auto"
        // Must be muted for autoplay to work reliably across browsers
        muted
        style={{ 
          width: "100vw", 
          height: "100vh", 
          objectFit: "cover",
          objectPosition: "center",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          backgroundColor: "#000"
        }}
        onLoadedData={() => {
          const video = videoRef.current;
          if (video && !playAttemptedRef.current) {
            video.volume = 1.0;
            playAttemptedRef.current = true;
            // Force play with promise handling
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log("Video autoplay started successfully");
                  setShowPlayButton(false);
                })
                .catch((err) => {
                  console.log("Autoplay prevented:", err);
                  setShowPlayButton(true);
                  playAttemptedRef.current = false;
                });
            }
          }
        }}
        onCanPlay={() => {
          const video = videoRef.current;
          if (video && !playAttemptedRef.current && video.readyState >= 3) {
            video.volume = 1.0;
            playAttemptedRef.current = true;
            video.play().catch((err) => {
              console.log("Play failed on canPlay:", err);
              setShowPlayButton(true);
              playAttemptedRef.current = false;
            });
          }
        }}
      >
        <source src={videoPath} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {/* Skip button - always visible */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 z-20 px-4 py-2 bg-black/50 hover:bg-black/70 text-white rounded-lg text-sm font-medium transition-all backdrop-blur-sm border border-white/20"
        style={{ zIndex: 20 }}
      >
        Skip Intro
      </button>

      {showPlayButton && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/70 cursor-pointer"
          onClick={handlePlayClick}
          style={{ zIndex: 2 }}
        >
          <div className="text-center">
            <button className="w-24 h-24 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center mb-4 transition-all backdrop-blur-sm">
              <svg className="w-12 h-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
            <p className="text-white text-lg font-medium">Click to play</p>
          </div>
        </div>
      )}

      {videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80" style={{ zIndex: 15 }}>
          <div className="text-center">
            <p className="text-white text-lg mb-4">Video failed to load</p>
            <button
              onClick={handleSkip}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-all"
            >
              Continue to App
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

