"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useReadContract } from "wagmi";
import { Address } from "@scaffold-ui/components";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import externalContracts from "~~/contracts/externalContracts";

const API_CREDITS_ADDRESS = "0x9991f959040De3c5df0515FFCe8B38b72cB7F26c";

interface HealthData {
  nullifiersSpent?: number;
  currentRoot?: string;
  status?: string;
}

const Home: NextPage = () => {
  const [healthData, setHealthData] = useState<HealthData>({});
  const [healthLoading, setHealthLoading] = useState(true);
  const { targetNetwork } = useTargetNetwork();

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
    const fetchHealth = async () => {
      try {
        const res = await fetch("https://zkllmapi.com/health");
        const data = await res.json();
        setHealthData(data);
      } catch (e) {
        console.error("Failed to fetch health:", e);
      } finally {
        setHealthLoading(false);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="px-5 max-w-3xl w-full">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Private LLM API.
          </h1>
          <p className="text-xl text-base-content/70">
            No account. No API key. Just a ZK proof.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-base-100 rounded-xl p-6 text-center shadow">
            <div className="text-3xl mb-3">1️⃣</div>
            <h3 className="font-bold text-lg mb-2">Stake CLAWD</h3>
            <p className="text-base-content/70 text-sm">
              Stake CLAWD tokens to purchase API credits. Each credit costs{" "}
              {pricePerCredit ? formatEther(pricePerCredit as bigint) : "..."} CLAWD.
            </p>
          </div>
          <div className="bg-base-100 rounded-xl p-6 text-center shadow">
            <div className="text-3xl mb-3">2️⃣</div>
            <h3 className="font-bold text-lg mb-2">Register</h3>
            <p className="text-base-content/70 text-sm">
              Generate a secret commitment and register it onchain. Your identity is hidden behind a hash.
            </p>
          </div>
          <div className="bg-base-100 rounded-xl p-6 text-center shadow">
            <div className="text-3xl mb-3">3️⃣</div>
            <h3 className="font-bold text-lg mb-2">Chat</h3>
            <p className="text-base-content/70 text-sm">
              Generate a ZK proof and send it with your message. The server verifies the proof — never your identity.
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex justify-center gap-4 mb-12">
          <Link href="/stake" className="btn btn-primary btn-lg">
            Get Credits
          </Link>
          <Link href="/chat" className="btn btn-secondary btn-lg">
            Start Chatting
          </Link>
        </div>

        {/* Live Stats */}
        <div className="bg-base-100 rounded-xl p-6 shadow mb-8">
          <h2 className="font-bold text-lg mb-4 text-center">📊 Live Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-base-content/60 text-sm">Tree Size</p>
              <p className="text-2xl font-bold">
                {treeData ? (treeData as unknown as bigint[])[0].toString() : "..."}
              </p>
            </div>
            <div className="text-center">
              <p className="text-base-content/60 text-sm">Nullifiers Spent</p>
              <p className="text-2xl font-bold">
                {healthLoading ? "..." : healthData.nullifiersSpent?.toString() ?? "N/A"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-base-content/60 text-sm">Current Root</p>
              <p className="text-sm font-mono break-all">
                {healthLoading
                  ? "..."
                  : healthData.currentRoot
                    ? `${healthData.currentRoot.toString().slice(0, 12)}...`
                    : treeData
                      ? `${(treeData as unknown as bigint[])[2].toString().slice(0, 12)}...`
                      : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Contract Address */}
        <div className="text-center mt-4 text-sm text-base-content/60 mb-8">
          <p className="mb-1">APICredits Contract:</p>
          <Address address={API_CREDITS_ADDRESS} chain={targetNetwork} />
        </div>
      </div>
    </div>
  );
};

export default Home;
