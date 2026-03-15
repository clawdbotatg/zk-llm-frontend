"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { SplashLoader } from "./SplashLoader";

const ScaffoldEthAppWithProviders = dynamic(
  () =>
    import("~~/components/ScaffoldEthAppWithProviders").then(m => {
      if (typeof window !== "undefined") {
        (window as any).__zkReady = true;
      }
      return { default: m.ScaffoldEthAppWithProviders };
    }),
  { ssr: false, loading: () => null },
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      {!splashDone && <SplashLoader onDone={() => setSplashDone(true)} />}
      {/* App fades in smoothly when splash clears */}
      <div
        style={{
          opacity: splashDone ? 1 : 0,
          transition: "opacity 0.6s ease",
          pointerEvents: splashDone ? "all" : "none",
        }}
      >
        <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
      </div>
    </>
  );
}
