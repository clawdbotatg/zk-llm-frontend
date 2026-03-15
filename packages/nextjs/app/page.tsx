"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.zkllmapi.com";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useReadContract } from "wagmi";
import externalContracts from "~~/contracts/externalContracts";

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
    <div className="flex items-center flex-col grow pt-16">
      <div className="px-5 max-w-2xl w-full text-center">

        {/* Hero */}
        <div className="mb-14">
          <h1 className="text-5xl font-bold mb-5 leading-tight">
            Private LLM API.<br />
            <span className="text-primary">No account required.</span>
          </h1>
          <p className="text-xl text-base-content/60 max-w-lg mx-auto">
            Buy credits with CLAWD. Get an API key. Use it anywhere.
            Your identity stays hidden behind a ZK proof.
          </p>
        </div>

        {/* CTA */}
        <div className="flex justify-center gap-4 mb-16">
          <Link href="/stake" className="btn btn-primary btn-lg px-8">
            Buy Credits
          </Link>
          <Link href="/chat" className="btn btn-outline btn-lg px-8">
            Try the Chat
          </Link>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-6 mb-16">
          <div className="text-center">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-bold mb-1">Buy</h3>
            <p className="text-base-content/60 text-sm">
              Stake {priceLabel} CLAWD per credit. One transaction, instantly ready.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🔑</div>
            <h3 className="font-bold mb-1">Get your API key</h3>
            <p className="text-base-content/60 text-sm">
              Receive a private key you can use in any script or app.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="font-bold mb-1">Call the API</h3>
            <p className="text-base-content/60 text-sm">
              Pass your key with each request. Server verifies via ZK — never your identity.
            </p>
          </div>
        </div>

        {/* Live stats — minimal */}
        <div className="flex justify-center gap-10 text-center mb-16 text-base-content/50 text-sm">
          <div>
            <p className="text-2xl font-bold text-base-content">{totalCredits ?? "—"}</p>
            <p>credits issued</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-base-content">{spentCount ?? "—"}</p>
            <p>API calls made</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-base-content">Base</p>
            <p>network</p>
          </div>
        </div>

        {/* Footer links */}
        <div className="text-sm text-base-content/40 mb-8 flex justify-center gap-6">
          <a
            href="https://github.com/clawdbotatg/zk-api-credits"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-base-content transition-colors"
          >
            GitHub
          </a>
          <a
            href={`https://basescan.org/address/${API_CREDITS_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-base-content transition-colors"
          >
            Contract
          </a>
          <Link href="/chat" className="hover:text-base-content transition-colors">
            Chat Demo
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Home;
