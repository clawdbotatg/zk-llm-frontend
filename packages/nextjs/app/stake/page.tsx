"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { Address } from "@scaffold-ui/components";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import externalContracts from "~~/contracts/externalContracts";

const API_CREDITS_ADDRESS = "0x45284835Fe6eC9937Ce8db8AEE32F3E684f900F3";
const CLAWD_ADDRESS = "0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07";

const apiCreditsAbi = externalContracts[8453].APICredits.abi;
const clawdAbi = externalContracts[8453].CLAWDToken.abi;

/** Map contract revert reasons to friendly messages */
const parseContractError = (e: any): string => {
  const msg = e?.shortMessage || e?.message || "";
  if (msg.includes("InsufficientStake") || msg.includes("insufficient")) return "Not enough CLAWD staked. Stake at least 1000 CLAWD first.";
  if (msg.includes("CommitmentAlreadyRegistered")) return "This commitment is already registered.";
  if (msg.includes("AlreadyUsed") || msg.includes("nullifier")) return "This credit has already been spent.";
  if (msg.includes("rejected") || msg.includes("denied")) return "Transaction rejected.";
  if (msg.includes("InsufficientBalance") || msg.includes("ERC20")) return "Insufficient CLAWD balance.";
  return msg || "Transaction failed. Please try again.";
};

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
  const { switchChain } = useSwitchChain();
  const [stakeAmount, setStakeAmount] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [registeredCredit, setRegisteredCredit] = useState<StoredCredit | null>(null);
  const [savedCredits, setSavedCredits] = useState<StoredCredit[]>([]);
  const [clawdPriceUsd, setClawdPriceUsd] = useState<number | null>(null);
  const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [approveCooldown, setApproveCooldown] = useState(false);

  const wrongNetwork = chain?.id !== 8453;

  // Fetch CLAWD price from DexScreener
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("https://api.dexscreener.com/latest/dex/tokens/0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07");
        const data = await res.json();
        const pair = data?.pairs?.[0];
        if (pair?.priceUsd) {
          setClawdPriceUsd(parseFloat(pair.priceUsd));
        }
      } catch (e) {
        console.error("Failed to fetch CLAWD price:", e);
      }
    };
    fetchPrice();
  }, []);

  const formatUsd = (clawdAmount: bigint | undefined): string => {
    if (!clawdAmount || clawdPriceUsd === null) return "";
    const amount = Number(formatEther(clawdAmount)) * clawdPriceUsd;
    return `(~$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
  };

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

  // Wait for approve tx confirmation
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  // When approve tx is confirmed, refetch allowance and clear state
  useEffect(() => {
    if (isApproveConfirmed && approveTxHash) {
      refetchAllowance();
      setIsApproving(false);
      setApproveTxHash(undefined);
      notification.success("Approval confirmed!");
    }
  }, [isApproveConfirmed, approveTxHash, refetchAllowance]);

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
      const hash = await writeContractAsync({
        address: CLAWD_ADDRESS,
        abi: clawdAbi,
        functionName: "approve",
        args: [API_CREDITS_ADDRESS, stakeAmountBigInt],
      });
      setApproveTxHash(hash);
      // Hold button disabled during the allowance re-fetch gap (wagmi cache lag)
      setApproveCooldown(true);
      setTimeout(() => setApproveCooldown(false), 4000);
      notification.success("Approval submitted! Waiting for confirmation...");
    } catch (e: any) {
      console.error(e);
      setTxError(parseContractError(e));
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
      setTxError(parseContractError(e));
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

      // Compute commitment using bb.js Poseidon2 (Noir/Barretenberg compatible)
      const { Barretenberg, Fr } = await import("@aztec/bb.js");
      const bbInstance = await Barretenberg.new({ threads: 1 });
      const frToBigInt = (fr: { value: Uint8Array }) => BigInt("0x" + Array.from(fr.value).map((b: number) => b.toString(16).padStart(2, "0")).join(""));
      const commitment = frToBigInt(await bbInstance.poseidon2Hash([new Fr(nullifierMod), new Fr(secretMod)]));
      await bbInstance.destroy();

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
      setTxError(parseContractError(e));
    } finally {
      setIsRegistering(false);
    }
  };

  // Approve button shows spinner while tx is pending OR confirming
  const approveLoading = isApproving || isApproveConfirming || approveCooldown;

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
                  : "..."}{" "}
                <span className="text-sm font-normal text-base-content/50">
                  {formatUsd(clawdBalance as bigint | undefined)}
                </span>
              </p>
            </div>
            <div>
              <p className="text-base-content/60 text-sm">Staked Balance</p>
              <p className="font-bold">
                {stakedBalance !== undefined
                  ? Number(formatEther(stakedBalance as bigint)).toLocaleString()
                  : "..."}{" "}
                <span className="text-sm font-normal text-base-content/50">
                  {formatUsd(stakedBalance as bigint | undefined)}
                </span>
              </p>
            </div>
          </div>

          <div className="mb-2 text-sm text-base-content/60">
            Price per credit: {pricePerCredit ? formatEther(pricePerCredit as bigint) : "..."} CLAWD{" "}
            <span className="text-base-content/50">
              {pricePerCredit && clawdPriceUsd !== null
                ? `(~$${(Number(formatEther(pricePerCredit as bigint)) * clawdPriceUsd).toFixed(2)})`
                : ""}
            </span>
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
            <button className="btn btn-warning w-full" onClick={() => switchChain({ chainId: 8453 })}>
              Switch to Base
            </button>
          ) : needsApproval ? (
            <button
              className="btn btn-primary w-full"
              disabled={approveLoading || stakeAmountBigInt === 0n}
              onClick={handleApprove}
            >
              {approveLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : null}
              {approveLoading ? "Approving..." : "Approve CLAWD"}
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
            <button className="btn btn-warning w-full" onClick={() => switchChain({ chainId: 8453 })}>
              Switch to Base
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
