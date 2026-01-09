// app/components/ConditionalHeader.tsx
"use client";
import { usePathname } from "next/navigation";

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Hide header completely - removed as per user request
  return null;
}

