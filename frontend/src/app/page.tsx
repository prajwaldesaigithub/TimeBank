// app/page.tsx - Landing Page
"use client";

import LandingHero from "./components/LandingHero";

// Landing page just shows the hero; the global intro video is handled by AppLoader once per browser
export default function LandingPage() {
  return <LandingHero />;
}