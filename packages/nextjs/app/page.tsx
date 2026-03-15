"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useReadContract } from "wagmi";
import externalContracts from "~~/contracts/externalContracts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.zkllmapi.com";
const API_CREDITS_ADDRESS = "0xc18fad39f72eBe5E54718D904C5012Da74594674";
const CLAWD_ADDRESS = "0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07";

const Home: NextPage = () => {
  const [spentCount, setSpentCount] = useState<number | null>(null);
  const [treeSize, setTreeSize] = useState<number | null>(null);
  const [clawdPriceUsd, setClawdPriceUsd] = useState<number | null>(null);

  const { data: pricePerCredit } = useReadContract({
    address: API_CREDITS_ADDRESS,
    abi: externalContracts[8453].APICredits.abi,
    functionName: "pricePerCredit",
    chainId: 8453,
  });

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(r => r.json())
      .then(d => {
        setSpentCount(d.spentNullifiers ?? null);
        setTreeSize(d.treeSize ?? null);
      })
      .catch(() => {});

    fetch("https://api.dexscreener.com/latest/dex/tokens/" + CLAWD_ADDRESS)
      .then(r => r.json())
      .then(d => {
        const price = d?.pairs?.[0]?.priceUsd;
        if (price) setClawdPriceUsd(parseFloat(price));
      })
      .catch(() => {});
  }, []);

  const priceInClawd = pricePerCredit
    ? Number(formatEther(pricePerCredit as bigint))
    : 2000;

  const priceLabel = priceInClawd.toLocaleString();

  const priceUsd = clawdPriceUsd !== null
    ? `~$${(priceInClawd * clawdPriceUsd).toFixed(4)} USD`
    : null;

  return (
    <div className="grid-bg min-h-[calc(100vh-56px)]">
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-32">

        {/* Tag line */}
        <div className="mb-6">
          <span className="text-xs font-mono text-primary border border-primary/30 px-2 py-1">
            ZK-GATED LLM API — BASE MAINNET
          </span>
        </div>

        {/* Hero */}
        <h1 className="text-6xl md:text-7xl font-mono font-bold leading-none mb-8 tracking-tight">
          Spend CLAWD.<br />
          <span className="text-primary">Get ZK LLM</span><br />
          access.
        </h1>

        <p className="text-base-content/50 text-lg font-mono mb-12 max-w-xl leading-relaxed">
          No account. No identity tied to your request.<br />
          Pay with CLAWD token → get a one-time API credit<br />
          backed by a zero-knowledge proof on Base.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-4 mb-20">
          <Link
            href="/stake"
            className="font-mono text-sm bg-[#00ff88] text-black px-6 py-3 hover:bg-[#00cc66] transition-colors font-bold"
          >
            BUY CREDITS →
          </Link>
          <Link
            href="/chat"
            className="font-mono text-sm border border-[#333] text-base-content/60 px-6 py-3 hover:border-[#00ff88]/50 hover:text-base-content transition-colors"
          >
            TRY THE DEMO
          </Link>
          <a
            href="/skill.md"
            className="font-mono text-sm text-base-content/30 hover:text-[#00ff88] transition-colors"
          >
            SKILL.md ↗
          </a>
        </div>

        {/* Stats bar */}
        <div className="border border-[#1f1f1f] grid grid-cols-3 mb-20">
          <div className="border-r border-[#1f1f1f] p-6">
            <p className="text-3xl font-mono font-bold">
              {treeSize ?? "—"}
            </p>
            <p className="text-xs font-mono text-base-content/40 mt-1">CREDITS ISSUED</p>
          </div>
          <div className="border-r border-[#1f1f1f] p-6">
            <p className="text-3xl font-mono font-bold">
              {spentCount ?? "—"}
            </p>
            <p className="text-xs font-mono text-base-content/40 mt-1">API CALLS MADE</p>
          </div>
          <div className="p-6">
            <p className="text-3xl font-mono font-bold text-[#00ff88]">{priceLabel}</p>
            <p className="text-xs font-mono text-base-content/40 mt-1">
              CLAWD/CREDIT {priceUsd ? `· ${priceUsd}` : ""}
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-20">
          <p className="text-xs font-mono text-base-content/30 mb-8 tracking-widest">HOW IT WORKS</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#1f1f1f]">
            {[
              {
                n: "01",
                title: "Buy a Credit",
                body: `Approve ${priceLabel} CLAWD${priceUsd ? ` (${priceUsd})` : ""} per credit. Your browser generates a secret locally — the contract only stores a hash.`,
              },
              {
                n: "02",
                title: "Generate a Proof",
                body: "When you chat, your browser generates a ZK proof that you own a valid credit — without revealing which one or who you are.",
              },
              {
                n: "03",
                title: "Call the LLM",
                body: "The server verifies your proof and forwards to the LLM. It knows you paid. Nothing else. Works in any script or app.",
              },
            ].map(({ n, title, body }, i) => (
              <div
                key={n}
                className={`p-8 ${i < 2 ? "md:border-r border-b md:border-b-0 border-[#1f1f1f]" : ""}`}
              >
                <p className="text-xs font-mono text-[#00ff88] mb-4">{n}</p>
                <h3 className="font-mono font-bold text-base mb-3">{title}</h3>
                <p className="text-sm font-mono text-base-content/50 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Code snippet */}
        <div className="mb-20">
          <p className="text-xs font-mono text-base-content/30 mb-4 tracking-widest">USE ANYWHERE</p>
          <div className="border border-[#1f1f1f] bg-[#111] overflow-x-auto">
            <div className="border-b border-[#1f1f1f] px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#333]"></div>
              <div className="w-2 h-2 rounded-full bg-[#333]"></div>
              <div className="w-2 h-2 rounded-full bg-[#333]"></div>
              <span className="text-xs font-mono text-base-content/30 ml-2">example.sh</span>
            </div>
            <pre className="p-6 text-xs font-mono text-base-content/70 leading-relaxed overflow-x-auto">{`# Get your key from zkllmapi.com/stake
API_KEY="zk-llm-<your-key-here>"

curl -X POST https://backend.zkllmapi.com/v1/chat \\
  -H 'Content-Type: application/json' \\
  -H "Authorization: Bearer $API_KEY" \\
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'`}</pre>
          </div>
        </div>

        {/* Bottom links */}
        <div className="flex flex-wrap gap-8 text-xs font-mono text-base-content/30">
          <a
            href="https://github.com/clawdbotatg/zk-api-credits"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#00ff88] transition-colors"
          >
            GITHUB ↗
          </a>
          <a
            href={`https://basescan.org/address/${API_CREDITS_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#00ff88] transition-colors"
          >
            CONTRACT ↗
          </a>
          <Link href="/about" className="hover:text-[#00ff88] transition-colors">ABOUT / DOCS</Link>
          <Link href="/fork" className="hover:text-[#00ff88] transition-colors">FORK THIS</Link>
          <a href="/skill.md" className="hover:text-[#00ff88] transition-colors">SKILL.md</a>
        </div>

      </div>
    </div>
  );
};

export default Home;
