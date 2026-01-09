"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LoadingVideo from "./LoadingVideo";

export function AppLoader() {
  const pathname = usePathname();
  const [showLoader, setShowLoader] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Don't show loader on dashboard pages (they have their own)
    if (pathname?.startsWith("/dashboard")) {
      return;
    }

    // Check if we've already shown the loader on this browser
    // Use localStorage so it persists across tabs/sessions
    const loaderShown =
      typeof window !== "undefined"
        ? window.localStorage.getItem("timebank-loader-shown")
        : null;
    if (loaderShown) {
      setVideoCompleted(true);
      return;
    }

    // Show loader for first load only
    setShowLoader(true);
  }, [pathname]);

  useEffect(() => {
    // Hide header when video is playing
    if (showLoader && !videoCompleted) {
      document.body.style.overflow = "hidden";
      const header = document.querySelector("header");
      if (header) {
        (header as HTMLElement).style.display = "none";
      }
    } else {
      document.body.style.overflow = "";
      const header = document.querySelector("header");
      if (header) {
        (header as HTMLElement).style.display = "";
      }
    }
  }, [showLoader, videoCompleted]);

  // Don't show loader on dashboard pages (they have their own)
  if (!mounted || pathname?.startsWith("/dashboard") || !showLoader || videoCompleted) {
    return null;
  }

  return (
    <LoadingVideo 
      onComplete={() => {
        console.log("AppLoader video completed");
        setVideoCompleted(true);
        setShowLoader(false);
        // Remember that we've shown the intro already
        if (typeof window !== "undefined") {
          window.localStorage.setItem("timebank-loader-shown", "true");
        }
        // Trigger header to show
        window.dispatchEvent(new Event("video-completed"));
      }}
      videoPath="/bigbang-intro.mp4"
    />
  );
}

