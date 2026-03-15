"use client";

import Link from "next/link";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 max-w-3xl">
        <h1 className="text-center">
          <span className="block text-4xl font-bold mb-2">🔐 ZK API Credits</span>
          <span className="block text-lg opacity-70">Private, anonymous LLM access via ZK proofs</span>
        </h1>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl">💰 Stake & Register</h2>
              <p className="opacity-70">
                Stake ETH, register anonymous commitments, and create API credits.
                Your identity is severed from your credits via ZK proofs.
              </p>
              <div className="card-actions justify-end mt-4">
                <Link href="/stake" className="btn btn-primary">
                  Get Credits →
                </Link>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl">💬 Chat</h2>
              <p className="opacity-70">
                Use your ZK proof to chat with an LLM anonymously.
                No wallet, no API key, no identity.
              </p>
              <div className="card-actions justify-end mt-4">
                <Link href="/chat" className="btn btn-secondary">
                  Start Chatting →
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-base-200 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">How it works</h3>
          <div className="steps steps-vertical">
            <div className="step step-primary">
              <div className="text-left ml-4">
                <p className="font-semibold">Stake ETH</p>
                <p className="text-sm opacity-70">Deposit ETH into the contract (withdrawable)</p>
              </div>
            </div>
            <div className="step step-primary">
              <div className="text-left ml-4">
                <p className="font-semibold">Register Commitment</p>
                <p className="text-sm opacity-70">Generate a secret, create a Poseidon commitment, insert into Merkle tree</p>
              </div>
            </div>
            <div className="step step-primary">
              <div className="text-left ml-4">
                <p className="font-semibold">ETH Moves to Server Pool</p>
                <p className="text-sm opacity-70">0.001 ETH per credit moves from your balance to the server pool (irreversible)</p>
              </div>
            </div>
            <div className="step step-secondary">
              <div className="text-left ml-4">
                <p className="font-semibold">Generate ZK Proof</p>
                <p className="text-sm opacity-70">Prove you know a valid secret without revealing your identity</p>
              </div>
            </div>
            <div className="step step-secondary">
              <div className="text-left ml-4">
                <p className="font-semibold">Chat Anonymously</p>
                <p className="text-sm opacity-70">Submit proof to API server → get LLM response. Server sees only your proof.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
