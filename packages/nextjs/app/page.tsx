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
    <div className="flex items-center flex-col grow pt-20">
      <div className="px-5 max-w-xl w-full text-center">

        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Spend CLAWD.<br />Get ZK LLM access.
          </h1>
          <p className="text-xl text-base-content/60">
            No account. No API key tied to your identity.<br />
            Just a ZK proof that you paid.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="flex flex-col items-center gap-3 mb-16">
          <Link href="/stake" className="btn btn-primary btn-lg px-12 text-lg">
            Get Credits →
          </Link>
          <div className="flex gap-6 text-sm text-base-content/40">
            <Link href="/chat" className="hover:text-base-content transition-colors">Try the chat demo</Link>
            <span>·</span>
            <Link href="/about" className="hover:text-base-content transition-colors">How it works</Link>
            <span>·</span>
            <a href="/skill.md" className="hover:text-base-content transition-colors">SKILL.md</a>
          </div>
        </div>

        {/* One-liner explainer */}
        <div className="grid grid-cols-3 gap-4 mb-16 text-sm">
          <div className="bg-base-100 rounded-xl p-4 shadow">
            <div className="text-2xl mb-2">💰</div>
            <p className="font-semibold mb-1">Stake {priceLabel} CLAWD</p>
            <p className="text-base-content/50 text-xs">per API credit</p>
          </div>
          <div className="bg-base-100 rounded-xl p-4 shadow">
            <div className="text-2xl mb-2">🔑</div>
            <p className="font-semibold mb-1">Get an API key</p>
            <p className="text-base-content/50 text-xs">works in any script or app</p>
          </div>
          <div className="bg-base-100 rounded-xl p-4 shadow">
            <div className="text-2xl mb-2">🤖</div>
            <p className="font-semibold mb-1">Call the LLM</p>
            <p className="text-base-content/50 text-xs">identity stays hidden</p>
          </div>
        </div>

        {/* Live stats */}
        <div className="flex justify-center gap-12 text-center mb-16 text-base-content/50 text-sm">
          <div>
            <p className="text-3xl font-bold text-base-content">{totalCredits ?? "—"}</p>
            <p>credits issued</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-base-content">{spentCount ?? "—"}</p>
            <p>API calls made</p>
          </div>
        </div>

        {/* Footer links */}
        <div className="text-xs text-base-content/30 mb-8 flex justify-center gap-6">
          <a
            href="https://github.com/clawdbotatg/zk-api-credits"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-base-content/60 transition-colors"
          >
            GitHub ↗
          </a>
          <a
            href={`https://basescan.org/address/${API_CREDITS_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-base-content/60 transition-colors"
          >
            Contract ↗
          </a>
          <Link href="/about" className="hover:text-base-content/60 transition-colors">
            About / Docs
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Home;
