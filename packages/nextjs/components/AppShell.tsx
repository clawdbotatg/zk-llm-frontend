"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { SplashLoader } from "./SplashLoader";

// Lazy-load the heavy wallet provider tree.
// This defers @rainbow-me/rainbowkit, wagmi, @walletconnect, @reown, @coinbase
// until AFTER the splash screen has shown, making initial paint near-instant.
const ScaffoldEthAppWithProviders = dynamic(
  () => import("~~/components/ScaffoldEthAppWithProviders").then(m => ({ default: m.ScaffoldEthAppWithProviders })),
  {
    ssr: false,
    loading: () => null, // splash handles the visual
  },
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  return (
    <>
      {!splashDone && <SplashLoader onDone={handleSplashDone} />}
      <ScaffoldEthAppWithProviders>{children}</ScaffoldEthAppWithProviders>
    </>
  );
}
