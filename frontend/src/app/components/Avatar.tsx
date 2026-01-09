"use client";

import { useState } from "react";
import { User } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-20 h-20"
};

export default function Avatar({ src, alt = "Avatar", className = "", fallback, size = "md" }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = () => {
    setImgError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (imgError || !src) {
    return (
      <div className={`${sizeClasses[size]} ${className} rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-semibold`}>
        {fallback ? (
          <span className="text-sm">{fallback.charAt(0).toUpperCase()}</span>
        ) : (
          <User className={`${size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : size === "xl" ? "w-10 h-10" : "w-6 h-6"}`} />
        )}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative rounded-full overflow-hidden bg-slate-700`}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-700 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        className={`w-full h-full object-cover ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity`}
      />
    </div>
  );
}

