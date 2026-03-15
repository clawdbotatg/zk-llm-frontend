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

  const priceUsd = clawdPriceUsd !== null
    ? `$${(priceInClawd * clawdPriceUsd).toFixed(4)}`
    : null;

  return (
    <div className="relative min-h-[calc(100vh-56px)]" style={{backgroundImage: "url(/hero.jpg)", backgroundSize: "cover", backgroundPosition: "center top"}}>
      <div className="absolute inset-0 bg-black/75" />
      <div className="relative z-10">
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-32">

        {/* Tag line */}
        <div className="mb-6">
          <span className="text-xs font-mono text-primary border border-primary/30 px-2 py-1">
            PRIVATE LLM API — BASE MAINNET — OPEN SOURCE
          </span>
        </div>

        {/* Hero */}
        <h1 className="text-6xl md:text-7xl font-mono font-bold leading-none mb-8 tracking-tight">
          Anonymous LLM<br />
          <span className="text-primary">access. No account.</span><br />
          No identity.<br />
          <span className="text-4xl md:text-5xl text-base-content/50">Hella forkable.</span>
        </h1>

        <p className="text-base-content/50 text-lg font-mono mb-12 max-w-xl leading-relaxed">
          Buy a credit onchain. Your browser generates a<br />
          zero-knowledge proof. The server verifies it.<br />
          It knows you paid. Nothing else.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-4 mb-20">
          <Link
            href="/stake"
            className="font-mono text-sm bg-[#F14E47] text-black px-6 py-3 hover:bg-[#d43d37] transition-colors font-bold"
          >
            BUY A CREDIT →
          </Link>
          <a
            href="/skill.md"
            className="font-mono text-sm border border-[#333] text-base-content/60 px-6 py-3 hover:border-[#42F38F]/50 hover:text-[#42F38F] transition-colors"
          >
            TRAIN YOUR BOT ↗
          </a>
        </div>

        {/* Stats bar */}
        <div className="border border-[#333] grid grid-cols-3 mb-20 bg-black/80 backdrop-blur-sm">
          <div className="border-r border-[#333] p-6">
            <p className="text-3xl font-mono font-bold">
              {treeSize ?? "—"}
            </p>
            <p className="text-xs font-mono text-base-content/40 mt-1">CREDITS ISSUED</p>
          </div>
          <div className="border-r border-[#333] p-6">
            <p className="text-3xl font-mono font-bold">
              {spentCount ?? "—"}
            </p>
            <p className="text-xs font-mono text-base-content/40 mt-1">API CALLS MADE</p>
          </div>
          <div className="p-6">
            <p className="text-3xl font-mono font-bold text-[#42F38F]">
              {priceUsd ?? "—"}
            </p>
            <p className="text-xs font-mono text-base-content/40 mt-1">PER CREDIT</p>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-20">
          <p className="text-xs font-mono text-base-content/30 mb-8 tracking-widest">HOW IT WORKS</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#333] bg-black/80 backdrop-blur-sm">
            {[
              {
                n: "01",
                title: "Buy a credit",
                body: priceUsd
                  ? `Pay ${priceUsd} on Base. Your browser generates a secret locally — the contract stores only a cryptographic hash.`
                  : "Pay on Base. Your browser generates a secret locally — the contract stores only a cryptographic hash.",
              },
              {
                n: "02",
                title: "Generate a proof",
                body: "When you make a request, your browser generates a zero-knowledge proof that you own a valid credit — without revealing which one.",
              },
              {
                n: "03",
                title: "Call the LLM",
                body: "POST your proof to our API. We verify it and forward to the model. We know you paid. That's all we know.",
              },
            ].map(({ n, title, body }, i) => (
              <div
                key={n}
                className={`p-8 ${i < 2 ? "md:border-r border-b md:border-b-0 border-[#333]" : ""}`}
              >
                <p className="text-xs font-mono text-[#42F38F] mb-4">{n}</p>
                <h3 className="font-mono font-bold text-base mb-3">{title}</h3>
                <p className="text-sm font-mono text-base-content/50 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Code snippet */}
        <div className="mb-20">
          <p className="text-xs font-mono text-base-content/30 mb-4 tracking-widest">USE ANYWHERE</p>
          <div className="border border-[#333] bg-black/90 backdrop-blur-sm overflow-x-auto">
            <div className="border-b border-[#333] px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#333]"></div>
              <div className="w-2 h-2 rounded-full bg-[#333]"></div>
              <div className="w-2 h-2 rounded-full bg-[#333]"></div>
              <span className="text-xs font-mono text-base-content/30 ml-2">example.sh</span>
            </div>
            <pre className="p-6 text-xs font-mono text-base-content/70 leading-relaxed overflow-x-auto">{`# Get your key from zkllmapi.com/stake
API_KEY="zk-llm-<your-key>"

curl -X POST https://backend.zkllmapi.com/v1/chat \\
  -H 'Content-Type: application/json' \\
  -H "Authorization: Bearer $API_KEY" \\
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'`}</pre>
          </div>
        </div>

        {/* Bottom links */}
        <div className="flex flex-wrap gap-8 text-xs font-mono text-base-content/50 bg-black/60 backdrop-blur-sm px-4 py-3 border border-[#333]">
          <a
            href="https://github.com/clawdbotatg/zk-api-credits"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#42F38F] transition-colors"
          >
            GITHUB ↗
          </a>
          <a
            href={`https://basescan.org/address/${API_CREDITS_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#42F38F] transition-colors"
          >
            CONTRACT ↗
          </a>
          <Link href="/about" className="hover:text-[#42F38F] transition-colors">HOW IT WORKS</Link>
          <Link href="/fork" className="hover:text-[#42F38F] transition-colors">FORK THIS</Link>
          <a href="/skill.md" className="hover:text-[#42F38F] transition-colors">SKILL.md</a>
        </div>

      </div>
      </div>
    </div>
  );
};

export default Home;
