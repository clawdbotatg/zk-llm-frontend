"use client";

import { useEffect, useRef, useState } from "react";

const LOADING_STEPS = [
  "initializing runtime...",
  "loading Poseidon2 hash function...",
  "loading UltraHonk prover...",
  "loading @aztec/bb.js...",
  "loading Barretenberg WASM...",
  "loading Noir circuit...",
  "loading binary_merkle_root...",
  "loading Merkle inclusion verifier...",
  "loading nullifier scheme...",
  "loading ZK proof system...",
  "loading smart contracts...",
  "loading APICredits.sol...",
  "loading CLAWDRouter...",
  "loading CLAWDPricing TWAP oracle...",
  "loading CLAWD token...",
  "loading USDC...",
  "loading ETH...",
  "loading Uniswap V3 swap router...",
  "loading wagmi connectors...",
  "loading WalletConnect...",
  "loading RainbowKit...",
  "loading viem...",
  "loading Base mainnet RPC...",
  "loading circuit artifacts...",
  "loading commitment scheme...",
  "loading anonymity set...",
  "loading Venice LLM gateway...",
  "loading zk-api-credits...",
];

export function SplashLoader({ onDone }: { onDone: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const stepIndexRef = useRef(0);
  const readyRef = useRef(false);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    // Jump to last step so the log looks complete, then fade
    const last = LOADING_STEPS.length - 1;
    stepIndexRef.current = last;
    setStepIndex(last);
    setTimeout(() => {
      setFading(true);
      setTimeout(onDone, 700);
    }, 300); // tiny pause on last line before fade
  };

  // Poll for window.__zkReady — when it fires, finish immediately
  useEffect(() => {
    const check = setInterval(() => {
      if ((window as any).__zkReady) {
        clearInterval(check);
        readyRef.current = true;
        finish();
      }
    }, 50);
    return () => clearInterval(check);
  }, []);

  // Advance steps every 250ms — purely cosmetic while waiting
  useEffect(() => {
    const lastStep = LOADING_STEPS.length - 1;
    const interval = setInterval(() => {
      if (doneRef.current) { clearInterval(interval); return; }
      const current = stepIndexRef.current;
      if (current < lastStep) {
        stepIndexRef.current = current + 1;
        setStepIndex(current + 1);
      }
      // If we reach the last step naturally, just hold — finish() fires from __zkReady poll
    }, 250);
    return () => clearInterval(interval);
  }, [onDone]);

  const visibleSteps = LOADING_STEPS.slice(Math.max(0, stepIndex - 5), stepIndex + 1);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#04040a",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-end",
        transition: "opacity 0.7s ease",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "all",
      }}
    >
      {/* Full-bleed video */}
      <video
        src="/loader.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.9,
        }}
      />

      {/* Subtle bottom fade so text is legible without killing the video */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, #04040acc 0%, transparent 45%)",
        }}
      />

      {/* Floating log — bottom-left, very transparent */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "0 28px 28px",
          fontFamily: "'Courier New', Courier, monospace",
          width: "100%",
          maxWidth: "480px",
        }}
      >
        {visibleSteps.map((step, i) => {
          const isLast = i === visibleSteps.length - 1;
          const fade = 0.18 + (i / (visibleSteps.length - 1)) * 0.72;
          return (
            <div
              key={step}
              style={{
                fontSize: "0.75rem",
                lineHeight: "1.85",
                display: "flex",
                alignItems: "center",
                gap: "7px",
                opacity: isLast ? 1 : fade * 0.5,
                transition: "opacity 0.3s ease",
              }}
            >
              <span style={{ color: isLast ? "#F14E47" : "#F14E4766", flexShrink: 0 }}>›</span>
              <span style={{ color: isLast ? "#e8ffe8" : "#42F38F99" }}>{step}</span>
              {isLast ? (
                <span
                  style={{
                    display: "inline-block",
                    width: "7px",
                    height: "13px",
                    background: "#42F38F",
                    animation: "blink 0.85s step-end infinite",
                    verticalAlign: "middle",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <span style={{ color: "#42F38F55", fontSize: "0.65rem", flexShrink: 0 }}>✓</span>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
