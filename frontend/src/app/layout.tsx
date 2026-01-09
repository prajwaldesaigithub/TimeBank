// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ConditionalHeader } from "./components/ConditionalHeader";
import { TransitionProvider } from "./components/TransitionProvider";
import { AppLoader } from "./components/AppLoader";

export const metadata: Metadata = {
  title: "TimeBank",
  description: "A time-sharing platform for services",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <AppLoader />
        <ConditionalHeader />
        <TransitionProvider>{children}</TransitionProvider>
      </body>
    </html>
  );
}
