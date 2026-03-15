"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useReadContract } from "wagmi";
import externalContracts from "~~/contracts/externalContracts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.zkllmapi.com";
const API_CREDITS_ADDRESS = "0x4A6782D251e12c06e1f16450D8b28f6C857cFdd1";

const Home: NextPage = () => {
  const [spentCount, setSpentCount] = useState<number | null>(null);

  const { data: treeData } = useReadContract({
    address: API_CREDITS_ADDRESS,
    abi: externalContracts[8453].APICredits.abi,
    functionName: "getTreeData",
    chainId: 8453,
  });

  const { data: pricePerCredit } = useReadContract({
    address: API_CREDITS_ADDRESS,
    abi: externalContracts[8453].APICredits.abi,
    functionName: "PRICE_PER_CREDIT",
    chainId: 8453,
  });

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(r => r.json())
      .then(d => setSpentCount(d.spentNullifiers ?? null))
      .catch(() => {});
  }, []);

  const totalCredits = treeData ? Number((treeData as bigint[])[0]) : null;
  const priceLabel = pricePerCredit
    ? Number(formatEther(pricePerCredit as bigint)).toLocaleString()
    : "1,000";

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
          Pay with CLAWD token → get a one-time API key<br />
          backed by a zero-knowledge proof.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-4 mb-20">
          <Link
            href="/stake"
            className="font-mono text-sm bg-primary text-black px-6 py-3 hover:bg-primary/80 transition-colors font-bold"
          >
            BUY CREDITS →
          </Link>
          <Link
            href="/chat"
            className="font-mono text-sm border border-[#333] text-base-content/60 px-6 py-3 hover:border-primary/50 hover:text-base-content transition-colors"
          >
            TRY THE DEMO
          </Link>
          <a
            href="/skill.md"
            className="font-mono text-sm text-base-content/30 hover:text-primary transition-colors"
          >
            SKILL.md ↗
          </a>
        </div>

        {/* Stats bar */}
        <div className="border border-[#1f1f1f] grid grid-cols-3 mb-20">
          <div className="border-r border-[#1f1f1f] p-6">
            <p className="text-3xl font-mono font-bold mono-stat">
              {totalCredits ?? "—"}
            </p>
            <p className="text-xs font-mono text-base-content/40 mt-1">CREDITS ISSUED</p>
          </div>
          <div className="border-r border-[#1f1f1f] p-6">
            <p className="text-3xl font-mono font-bold mono-stat">
              {spentCount ?? "—"}
            </p>
            <p className="text-xs font-mono text-base-content/40 mt-1">API CALLS MADE</p>
          </div>
          <div className="p-6">
            <p className="text-3xl font-mono font-bold">{priceLabel}</p>
            <p className="text-xs font-mono text-base-content/40 mt-1">CLAWD PER CREDIT</p>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-20">
          <p className="text-xs font-mono text-base-content/30 mb-8 tracking-widest">HOW IT WORKS</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#1f1f1f]">
            {[
              {
                n: "01",
                title: "Stake CLAWD",
                body: `Send ${priceLabel} CLAWD per credit to the APICredits contract. One transaction covers approval, staking, and credit registration.`,
              },
              {
                n: "02",
                title: "Get API keys",
                body: "Your browser generates secret credentials locally. The contract stores only a Poseidon2 hash. Your identity is never revealed.",
              },
              {
                n: "03",
                title: "Call the LLM",
                body: "Pass your key with each request. The server verifies a ZK proof — it knows you paid, nothing else. Works in any script or app.",
              },
            ].map(({ n, title, body }, i) => (
              <div
                key={n}
                className={`p-8 ${i < 2 ? "md:border-r border-b md:border-b-0 border-[#1f1f1f]" : ""}`}
              >
                <p className="text-xs font-mono text-primary mb-4">{n}</p>
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
            <pre className="p-6 text-xs font-mono text-base-content/70 leading-relaxed overflow-x-auto">{`# Your API key (from the Buy page)
API_KEY="zklm_<nullifier>_<secret>_<commitment>"

# Split and call
IFS='_' read -r _ N S C <<< "$API_KEY"
curl -X POST https://backend.zkllmapi.com/chat \\
  -H 'Content-Type: application/json' \\
  -d '{"nullifier":"'$N'","secret":"'$S'","commitment":"'$C'","message":"Hello"}'`}</pre>
          </div>
        </div>

        {/* Bottom links */}
        <div className="flex flex-wrap gap-8 text-xs font-mono text-base-content/30">
          <a
            href="https://github.com/clawdbotatg/zk-api-credits"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            GITHUB ↗
          </a>
          <a
            href={`https://basescan.org/address/${API_CREDITS_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            CONTRACT ↗
          </a>
          <Link href="/about" className="hover:text-primary transition-colors">ABOUT / DOCS</Link>
          <a href="/skill.md" className="hover:text-primary transition-colors">SKILL.md</a>
        </div>

      </div>
    </div>
  );
};

export default Home;
