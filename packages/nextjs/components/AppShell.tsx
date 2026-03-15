"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { SplashLoader } from "./SplashLoader";

// Lazy-load the entire wallet provider tree.
// Defers @rainbow-me/rainbowkit, wagmi, @walletconnect, @reown, @coinbase (~633MB)
// until after the splash sequence. Sets window.__zkReady when resolved.
const ScaffoldEthAppWithProviders = dynamic(
  () =>
    import("~~/components/ScaffoldEthAppWithProviders").then(m => {
      // Signal the splash loader that everything is hydrated
      if (typeof window !== "undefined") {
        (window as any).__zkReady = true;
      }
      return { default: m.ScaffoldEthAppWithProviders };
    }),
  {
    ssr: false,
    loading: () => null,
  },
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      {!splashDone && <SplashLoader onDone={() => setSplashDone(true)} />}
      {/* Always mount providers so they load in background during splash */}
      <div style={{ visibility: splashDone ? "visible" : "hidden", pointerEvents: splashDone ? "all" : "none" }}>
        <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
      </div>
    </>
  );
}
