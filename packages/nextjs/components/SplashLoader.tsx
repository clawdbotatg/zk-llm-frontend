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
  const [ready, setReady] = useState(false); // set externally via onDone signal
  const stepIndexRef = useRef(0);
  const readyRef = useRef(false);

  // Signal from parent that wallet providers finished loading
  // We store in ref so the interval closure can see it
  useEffect(() => {
    // We abuse onDone as a "ready" signal — parent calls it when lazy import resolves
    // But we intercept it here: only actually fade when BOTH ready AND on last step
  }, []);

  // Expose a way for AppShell to signal readiness
  useEffect(() => {
    // AppShell will set window.__zkReady = true when providers load
    const check = setInterval(() => {
      if ((window as any).__zkReady) {
        readyRef.current = true;
        clearInterval(check);
      }
    }, 100);
    return () => clearInterval(check);
  }, []);

  // Step through loading items every 250ms
  useEffect(() => {
    const lastStep = LOADING_STEPS.length - 1;
    const interval = setInterval(() => {
      const current = stepIndexRef.current;
      if (current < lastStep) {
        stepIndexRef.current = current + 1;
        setStepIndex(current + 1);
      } else {
        // On last step — wait for readyRef then fade
        if (readyRef.current) {
          clearInterval(interval);
          setFading(true);
          setTimeout(onDone, 700);
        }
        // else: stay on last step, keep checking each tick
      }
    }, 250);
    return () => clearInterval(interval);
  }, [onDone]);

  const visibleSteps = LOADING_STEPS.slice(Math.max(0, stepIndex - 6), stepIndex + 1);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#06060a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 0.7s ease",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "all",
      }}
    >
      {/* Video background */}
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
          opacity: 0.45,
        }}
      />

      {/* Dark gradient overlay so text is readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, #06060aee 40%, #06060a88 100%)",
        }}
      />

      {/* Terminal window */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          fontFamily: "'Courier New', Courier, monospace",
          width: "min(560px, 90vw)",
          background: "#0d0d15cc",
          border: "1px solid #42F38F44",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 0 40px #42F38F22, 0 0 80px #42F38F11",
        }}
      >
        {/* Terminal title bar */}
        <div
          style={{
            background: "#1a1a2e",
            borderBottom: "1px solid #42F38F33",
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#F14E47" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#42F38F" }} />
          <span style={{ marginLeft: 8, fontSize: "0.7rem", color: "#42F38F88", letterSpacing: "0.15em" }}>
            zk-llm-api — boot sequence
          </span>
        </div>

        {/* Log lines */}
        <div style={{ padding: "16px 18px 20px", minHeight: "160px" }}>
          {visibleSteps.map((step, i) => {
            const isLast = i === visibleSteps.length - 1;
            const isCurrent = stepIndex === LOADING_STEPS.indexOf(step);
            const isOnFinalStep = stepIndex === LOADING_STEPS.length - 1;
            return (
              <div
                key={step}
                style={{
                  fontSize: "0.8rem",
                  lineHeight: "1.7",
                  color: isLast ? "#42F38F" : "#42F38F66",
                  opacity: isLast ? 1 : 0.5 - (visibleSteps.length - 1 - i) * 0.08,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ color: isLast ? "#F14E47" : "#F14E4733" }}>›</span>
                <span>{step}</span>
                {isLast && (
                  <span
                    style={{
                      display: "inline-block",
                      width: "8px",
                      height: "14px",
                      background: "#42F38F",
                      animation: "blink 0.8s step-end infinite",
                      marginLeft: "2px",
                      verticalAlign: "middle",
                    }}
                  />
                )}
                {!isLast && (
                  <span style={{ color: "#42F38F44", fontSize: "0.7rem" }}>✓</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div style={{ height: "2px", background: "#42F38F22" }}>
          <div
            style={{
              height: "100%",
              background: "linear-gradient(to right, #42F38F, #F14E47)",
              width: `${((stepIndex + 1) / LOADING_STEPS.length) * 100}%`,
              transition: "width 0.25s ease",
              boxShadow: "0 0 8px #42F38F",
            }}
          />
        </div>
      </div>

      {/* ZK LLM wordmark below */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: "24px",
          fontFamily: "monospace",
          fontSize: "0.7rem",
          letterSpacing: "0.4em",
          color: "#ffffff33",
        }}
      >
        ZK LLM API
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
