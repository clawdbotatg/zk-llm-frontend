"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { Address } from "@scaffold-ui/components";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import externalContracts from "~~/contracts/externalContracts";

const API_CREDITS_ADDRESS = "0x9991f959040De3c5df0515FFCe8B38b72cB7F26c";
const CLAWD_ADDRESS = "0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07";

const apiCreditsAbi = externalContracts[8453].APICredits.abi;
const clawdAbi = externalContracts[8453].CLAWDToken.abi;

interface StoredCredit {
  nullifier: string;
  secret: string;
  commitment: string;
  leafIndex: number;
  spent: boolean;
}

const StakePage: NextPage = () => {
  const { address: connectedAddress, chain } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const [stakeAmount, setStakeAmount] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [registeredCredit, setRegisteredCredit] = useState<StoredCredit | null>(null);
  const [savedCredits, setSavedCredits] = useState<StoredCredit[]>([]);

  const wrongNetwork = chain?.id !== 8453;

  // Read CLAWD balance
  const { data: clawdBalance, refetch: refetchBalance } = useReadContract({
    address: CLAWD_ADDRESS,
    abi: clawdAbi,
    functionName: "balanceOf",
    args: connectedAddress ? [connectedAddress] : undefined,
    chainId: 8453,
    query: { enabled: !!connectedAddress },
  });

  // Read allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CLAWD_ADDRESS,
    abi: clawdAbi,
    functionName: "allowance",
    args: connectedAddress ? [connectedAddress, API_CREDITS_ADDRESS] : undefined,
    chainId: 8453,
    query: { enabled: !!connectedAddress },
  });

  // Read staked balance
  const { data: stakedBalance, refetch: refetchStaked } = useReadContract({
    address: API_CREDITS_ADDRESS,
    abi: apiCreditsAbi,
    functionName: "stakedBalance",
    args: connectedAddress ? [connectedAddress] : undefined,
    chainId: 8453,
    query: { enabled: !!connectedAddress },
  });

  // Read price per credit
  const { data: pricePerCredit } = useReadContract({
    address: API_CREDITS_ADDRESS,
    abi: apiCreditsAbi,
    functionName: "PRICE_PER_CREDIT",
    chainId: 8453,
  });

  const { writeContractAsync } = useWriteContract();

  // Load saved credits from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zk-credits");
      if (stored) {
        setSavedCredits(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load credits:", e);
    }
  }, []);

  const stakeAmountBigInt = (() => {
    try {
      return stakeAmount ? parseEther(stakeAmount) : 0n;
    } catch {
      return 0n;
    }
  })();

  const needsApproval = stakeAmountBigInt > 0n && (!allowance || (allowance as bigint) < stakeAmountBigInt);

  const handleApprove = async () => {
    if (!connectedAddress) return;
    setIsApproving(true);
    setTxError(null);
    try {
      await writeContractAsync({
        address: CLAWD_ADDRESS,
        abi: clawdAbi,
        functionName: "approve",
        args: [API_CREDITS_ADDRESS, stakeAmountBigInt],
      });
      notification.success("Approval submitted! Waiting for confirmation...");
      // Wait a bit then refetch
      setTimeout(() => {
        refetchAllowance();
      }, 5000);
    } catch (e: any) {
      console.error(e);
      if (e?.message?.includes("User rejected")) {
        setTxError("Transaction rejected by user");
      } else {
        setTxError("Approval failed: " + (e?.shortMessage || e?.message || "Unknown error"));
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleStake = async () => {
    if (!connectedAddress) return;
    setIsStaking(true);
    setTxError(null);
    try {
      await writeContractAsync({
        address: API_CREDITS_ADDRESS,
        abi: apiCreditsAbi,
        functionName: "stake",
        args: [stakeAmountBigInt],
      });
      notification.success("Staking successful!");
      setStakeAmount("");
      setTimeout(() => {
        refetchStaked();
        refetchBalance();
        refetchAllowance();
      }, 5000);
    } catch (e: any) {
      console.error(e);
      if (e?.message?.includes("User rejected")) {
        setTxError("Transaction rejected by user");
      } else {
        setTxError("Staking failed: " + (e?.shortMessage || e?.message || "Unknown error"));
      }
    } finally {
      setIsStaking(false);
    }
  };

  const handleRegister = async () => {
    if (!connectedAddress) return;
    setIsRegistering(true);
    setTxError(null);
    setRegisteredCredit(null);
    try {
      // Generate random nullifier and secret
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const nullifier = BigInt("0x" + Array.from(randomBytes).map(b => b.toString(16).padStart(2, "0")).join(""));
      
      const randomBytes2 = new Uint8Array(32);
      crypto.getRandomValues(randomBytes2);
      const secret = BigInt("0x" + Array.from(randomBytes2).map(b => b.toString(16).padStart(2, "0")).join(""));

      // Field modulus for BN254 — values must be < this
      const FIELD_MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
      const nullifierMod = nullifier % FIELD_MODULUS;
      const secretMod = secret % FIELD_MODULUS;

      // Compute commitment using poseidon2
      const { poseidon2 } = await import("poseidon-lite");
      const commitment = poseidon2([nullifierMod, secretMod]);

      // Send register tx
      await writeContractAsync({
        address: API_CREDITS_ADDRESS,
        abi: apiCreditsAbi,
        functionName: "register",
        args: [commitment],
      });

      // Save to localStorage
      const newCredit: StoredCredit = {
        nullifier: nullifierMod.toString(),
        secret: secretMod.toString(),
        commitment: commitment.toString(),
        leafIndex: -1, // Will be updated from events
        spent: false,
      };

      const existingCredits = JSON.parse(localStorage.getItem("zk-credits") || "[]");
      const updatedCredits = [...existingCredits, newCredit];
      localStorage.setItem("zk-credits", JSON.stringify(updatedCredits));
      setSavedCredits(updatedCredits);
      setRegisteredCredit(newCredit);

      notification.success("Credit registered! Save your credentials.");
      setTimeout(() => {
        refetchStaked();
        refetchBalance();
      }, 5000);
    } catch (e: any) {
      console.error(e);
      if (e?.message?.includes("User rejected")) {
        setTxError("Transaction rejected by user");
      } else {
        setTxError("Registration failed: " + (e?.shortMessage || e?.message || "Unknown error"));
      }
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="px-5 max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Stake & Register</h2>

        {/* Step A: Stake CLAWD */}
        <div className="bg-base-100 rounded-xl p-6 shadow mb-6">
          <h3 className="font-bold text-lg mb-4">Step 1: Stake CLAWD</h3>

          {/* Balances */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-base-content/60 text-sm">CLAWD Balance</p>
              <p className="font-bold">
                {clawdBalance !== undefined
                  ? Number(formatEther(clawdBalance as bigint)).toLocaleString()
                  : "..."}
              </p>
            </div>
            <div>
              <p className="text-base-content/60 text-sm">Staked Balance</p>
              <p className="font-bold">
                {stakedBalance !== undefined
                  ? Number(formatEther(stakedBalance as bigint)).toLocaleString()
                  : "..."}
              </p>
            </div>
          </div>

          <div className="mb-2 text-sm text-base-content/60">
            Price per credit: {pricePerCredit ? formatEther(pricePerCredit as bigint) : "..."} CLAWD
          </div>

          {/* Stake Input */}
          <div className="mb-4">
            <label className="label text-sm font-medium">Amount to Stake</label>
            <input
              type="text"
              placeholder="1000"
              className="input input-bordered w-full"
              value={stakeAmount}
              onChange={e => {
                setStakeAmount(e.target.value);
                setTxError(null);
              }}
            />
          </div>

          {/* Action Buttons — One at a time per ethskills Rule 2 */}
          {!connectedAddress ? (
            <RainbowKitCustomConnectButton />
          ) : wrongNetwork ? (
            <button className="btn btn-warning w-full" disabled>
              Switch to Base in your wallet
            </button>
          ) : needsApproval ? (
            <button
              className="btn btn-primary w-full"
              disabled={isApproving || stakeAmountBigInt === 0n}
              onClick={handleApprove}
            >
              {isApproving ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : null}
              {isApproving ? "Approving..." : "Approve CLAWD"}
            </button>
          ) : (
            <button
              className="btn btn-primary w-full"
              disabled={isStaking || stakeAmountBigInt === 0n}
              onClick={handleStake}
            >
              {isStaking ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : null}
              {isStaking ? "Staking..." : "Stake"}
            </button>
          )}

          {txError && (
            <div className="mt-3 alert alert-error text-sm">
              <span>{txError}</span>
            </div>
          )}
        </div>

        {/* Step B: Register */}
        <div className="bg-base-100 rounded-xl p-6 shadow mb-6">
          <h3 className="font-bold text-lg mb-4">Step 2: Register a Credit</h3>
          <p className="text-base-content/60 text-sm mb-4">
            This generates a random nullifier + secret, computes a Poseidon commitment, and registers it onchain.
            Your staked balance will be reduced by {pricePerCredit ? formatEther(pricePerCredit as bigint) : "..."} CLAWD.
          </p>

          {!connectedAddress ? (
            <RainbowKitCustomConnectButton />
          ) : wrongNetwork ? (
            <button className="btn btn-warning w-full" disabled>
              Switch to Base in your wallet
            </button>
          ) : (
            <button
              className="btn btn-secondary w-full"
              disabled={isRegistering}
              onClick={handleRegister}
            >
              {isRegistering ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : null}
              {isRegistering ? "Generating & Registering..." : "Generate & Register Commitment"}
            </button>
          )}

          {registeredCredit && (
            <div className="mt-4 bg-base-200 rounded-lg p-4">
              <p className="font-bold text-success mb-2">✅ Credit Registered!</p>
              <p className="text-xs text-base-content/60 mb-2">
                ⚠️ Back up these credentials! They cannot be recovered.
              </p>
              <div className="text-xs font-mono break-all space-y-1">
                <p><span className="font-bold">Nullifier:</span> {registeredCredit.nullifier}</p>
                <p><span className="font-bold">Secret:</span> {registeredCredit.secret}</p>
                <p><span className="font-bold">Commitment:</span> {registeredCredit.commitment}</p>
              </div>
            </div>
          )}
        </div>

        {/* Saved Credits */}
        {savedCredits.length > 0 && (
          <div className="bg-base-100 rounded-xl p-6 shadow mb-8">
            <h3 className="font-bold text-lg mb-4">Your Credits ({savedCredits.length})</h3>
            <div className="space-y-2">
              {savedCredits.map((credit, i) => (
                <div key={i} className="flex items-center justify-between bg-base-200 rounded-lg p-3">
                  <div className="text-sm">
                    <span className="font-mono text-xs">
                      Commitment: {credit.commitment.slice(0, 12)}...
                    </span>
                  </div>
                  <span className={`badge ${credit.spent ? "badge-error" : "badge-success"}`}>
                    {credit.spent ? "Spent" : "Available"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contract */}
        <div className="text-center mt-4 text-sm text-base-content/60 mb-8">
          <p className="mb-1">APICredits Contract:</p>
          <Address address={API_CREDITS_ADDRESS} chain={targetNetwork} />
        </div>
      </div>
    </div>
  );
};

export default StakePage;
