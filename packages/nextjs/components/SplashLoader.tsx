"use client";

import { useEffect, useState } from "react";

export function SplashLoader({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Minimum show time: 1.8s so the video has a moment to breathe
    // Then fade out smoothly
    const min = setTimeout(() => {
      setFading(true);
      setTimeout(onDone, 600); // match transition duration
    }, 1800);
    return () => clearTimeout(min);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 0.6s ease",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "all",
      }}
    >
      {/* Video fills the background */}
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
          opacity: 0.85,
        }}
      />

      {/* Overlay text */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          fontFamily: "monospace",
          color: "#42F38F",
          textShadow: "0 0 20px #42F38F88",
        }}
      >
        <div style={{ fontSize: "1.1rem", letterSpacing: "0.3em", opacity: 0.9 }}>
          ZK LLM API
        </div>
        <div
          style={{
            marginTop: "1rem",
            fontSize: "0.75rem",
            letterSpacing: "0.2em",
            color: "#ffffff88",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        >
          loading proofs...
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
