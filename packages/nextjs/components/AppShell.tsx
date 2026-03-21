"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { SplashLoader } from "./SplashLoader";

const ScaffoldEthAppWithProviders = dynamic(
  () =>
    import("~~/components/ScaffoldEthAppWithProviders").then((m) => {
      if (typeof window !== "undefined") {
        (window as any).__zkReady = true;
      }
      return { default: m.ScaffoldEthAppWithProviders };
    }),
  { ssr: false, loading: () => null },
);

export function AppShell({ children }: { children: React.ReactNode }) {
  // Only show splash on the very first visit (sessionStorage survives page navigations
  // but not browser close/tab close — appropriate since wallet state resets on close)
  const [splashDone, setSplashDone] = useState(
    () =>
      typeof window !== "undefined" &&
      window.sessionStorage.getItem("zk-splash-done") === "1",
  );

  // Once splash is done, persist to sessionStorage so it doesn't re-appear on next navigation
  useEffect(() => {
    if (splashDone) {
      window.sessionStorage.setItem("zk-splash-done", "1");
    }
  }, [splashDone]);

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
