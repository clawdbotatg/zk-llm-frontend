"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import externalContracts from "~~/contracts/externalContracts";

const API_CREDITS_ADDRESS = "0x4A6782D251e12c06e1f16450D8b28f6C857cFdd1";
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
  const [approveConfirmed, setApproveConfirmed] = useState(false); // true after on-chain confirmation

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

  // When approve tx is confirmed on-chain, mark approved and refetch
  useEffect(() => {
    if (isApproveConfirmed && approveTxHash) {
      setIsApproving(false);
      setApproveTxHash(undefined);
      setApproveConfirmed(true); // override needsApproval immediately
      setApproveCooldown(false);
      refetchAllowance();
      notification.success("Approved! You can now stake.");
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

  // needsApproval: false if on-chain confirmed OR allowance already sufficient
  const needsApproval = !approveConfirmed &&
    stakeAmountBigInt > 0n &&
    (!allowance || (allowance as bigint) < stakeAmountBigInt);

  // Once allowance catches up, clear the approveConfirmed override
  useEffect(() => {
    if (approveConfirmed && allowance && (allowance as bigint) >= stakeAmountBigInt && stakeAmountBigInt > 0n) {
      setApproveConfirmed(false);
    }
  }, [approveConfirmed, allowance, stakeAmountBigInt]);

  // Reset approveConfirmed if user changes stake amount
  useEffect(() => {
    setApproveConfirmed(false);
  }, [stakeAmount]);

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
      setTimeout(() => setApproveCooldown(false), 10000); // fallback — cleared earlier by useEffect when allowance updates
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
      const PRICE_PER_CREDIT = 1000n * 10n ** 18n;
      const numCredits = Number(stakeAmountBigInt / PRICE_PER_CREDIT);
      if (numCredits === 0) { setTxError("Minimum 1000 CLAWD required."); return; }

      // Generate all commitments BEFORE the tx
      notification.success("Generating commitments...");
      const { Barretenberg, Fr } = await import("@aztec/bb.js");
      const bbInstance = await Barretenberg.new({ threads: 1 });
      const frToBigInt = (fr: { value: Uint8Array }) =>
        BigInt("0x" + Array.from(fr.value).map((b: number) => b.toString(16).padStart(2, "0")).join(""));
      const FIELD_MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

      const newCredits: StoredCredit[] = [];
      const commitments: bigint[] = [];

      for (let i = 0; i < numCredits; i++) {
        const rb1 = new Uint8Array(32); crypto.getRandomValues(rb1);
        const rb2 = new Uint8Array(32); crypto.getRandomValues(rb2);
        const nullifier = BigInt("0x" + Array.from(rb1).map(b => b.toString(16).padStart(2, "0")).join("")) % FIELD_MODULUS;
        const secret = BigInt("0x" + Array.from(rb2).map(b => b.toString(16).padStart(2, "0")).join("")) % FIELD_MODULUS;
        const commitment = frToBigInt(await bbInstance.poseidon2Hash([new Fr(nullifier), new Fr(secret)]));
        commitments.push(commitment);
        newCredits.push({ nullifier: nullifier.toString(), secret: secret.toString(), commitment: commitment.toString(), leafIndex: -1, spent: false });
      }
      await bbInstance.destroy();

      // ONE transaction: stake + register all credits atomically
      notification.success(`Staking & registering ${numCredits} credit${numCredits > 1 ? "s" : ""} in one tx...`);
      await writeContractAsync({
        address: API_CREDITS_ADDRESS,
        abi: apiCreditsAbi,
        functionName: "stakeAndRegister",
        args: [stakeAmountBigInt, commitments],
      });

      // Save all new credits to localStorage
      const existing = JSON.parse(localStorage.getItem("zk-credits") || "[]");
      const all = [...existing, ...newCredits];
      localStorage.setItem("zk-credits", JSON.stringify(all));
      setSavedCredits(all);
      setRegisteredCredit(newCredits[newCredits.length - 1]);

      notification.success(`✅ ${numCredits} credit${numCredits > 1 ? "s" : ""} ready to use!`);
      setStakeAmount("");
      setTimeout(() => { refetchStaked(); refetchBalance(); refetchAllowance(); }, 3000);
    } catch (e: any) {
      console.error(e);
      setTxError(parseContractError(e));
    } finally {
      setIsStaking(false);
      setIsRegistering(false);
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

    const numCredits = stakeAmountBigInt > 0n ? Number(stakeAmountBigInt / (1000n * 10n ** 18n)) : 0;
  const availableCredits = savedCredits.filter(c => !c.spent);

  // Format a credit as a portable API key string
  const toApiKey = (c: StoredCredit) =>
    `zklm_${c.nullifier}_${c.secret}_${c.commitment}`;

  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="px-5 max-w-lg w-full">

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Buy API Credits</h2>
          <p className="text-base-content/60">
            {pricePerCredit ? Number(formatEther(pricePerCredit as bigint)).toLocaleString() : "1,000"} CLAWD per credit
            {pricePerCredit && clawdPriceUsd !== null
              ? ` (~$${(Number(formatEther(pricePerCredit as bigint)) * clawdPriceUsd).toFixed(2)} each)`
              : ""}
          </p>
        </div>

        {/* Buy box */}
        <div className="bg-base-100 rounded-xl p-6 shadow mb-6">

          {/* Wallet balance */}
          {connectedAddress && (
            <div className="flex justify-between text-sm text-base-content/60 mb-4">
              <span>Your CLAWD</span>
              <span className="font-mono">
                {clawdBalance !== undefined
                  ? Number(formatEther(clawdBalance as bigint)).toLocaleString()
                  : "..."}{" "}
                <span className="text-base-content/40">{formatUsd(clawdBalance as bigint | undefined)}</span>
              </span>
            </div>
          )}

          {/* Amount input */}
          <div className="mb-1">
            <input
              type="text"
              placeholder="1000"
              className="input input-bordered w-full text-lg"
              value={stakeAmount}
              onChange={e => {
                setStakeAmount(e.target.value);
                setTxError(null);
              }}
            />
          </div>

          {/* Credit count hint */}
          <p className="text-sm text-base-content/50 mb-4 text-right">
            {numCredits > 0 ? `= ${numCredits} API credit${numCredits !== 1 ? "s" : ""}` : " "}
          </p>

          {/* Action button */}
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
              {approveLoading && <span className="loading loading-spinner loading-sm mr-2"></span>}
              {approveLoading ? "Approving..." : "Approve CLAWD"}
            </button>
          ) : (
            <button
              className="btn btn-primary w-full"
              disabled={isStaking || stakeAmountBigInt === 0n || numCredits === 0}
              onClick={handleStake}
            >
              {isStaking && <span className="loading loading-spinner loading-sm mr-2"></span>}
              {isStaking ? "Buying..." : `Buy ${numCredits > 0 ? numCredits : ""} Credit${numCredits !== 1 ? "s" : ""}`}
            </button>
          )}

          {txError && (
            <div className="mt-3 alert alert-error text-sm">
              <span>{txError}</span>
            </div>
          )}
        </div>

        {/* Your API Keys */}
        {availableCredits.length > 0 && (
          <div className="bg-base-100 rounded-xl p-6 shadow mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Your API Keys</h3>
              <span className="badge badge-success">{availableCredits.length} available</span>
            </div>
            <p className="text-sm text-base-content/60 mb-4">
              Use these in your scripts. Each key works for one API call.
            </p>
            <div className="space-y-3">
              {availableCredits.map((credit, i) => (
                <div key={i} className="bg-base-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-base-content/50">Credit {i + 1}</span>
                    <button
                      className="btn btn-xs btn-ghost"
                      onClick={() => navigator.clipboard.writeText(toApiKey(credit))}
                    >
                      Copy
                    </button>
                  </div>
                  <p className="font-mono text-xs break-all text-base-content/70">
                    {toApiKey(credit).slice(0, 40)}...
                  </p>
                </div>
              ))}
            </div>

            {/* Usage example */}
            <details className="mt-4">
              <summary className="text-xs text-base-content/50 cursor-pointer hover:text-base-content">
                How to use in a script ↓
              </summary>
              <div className="mt-3 bg-base-300 rounded-lg p-3 text-xs font-mono">
                <p className="text-base-content/60 mb-1"># Parse your API key</p>
                <p>{"API_KEY=\"zklm_<nullifier>_<secret>_<commitment>\""}</p>
                <p className="mt-2 text-base-content/60"># Split and use</p>
                <p>{"IFS='_' read -r _ NULLIFIER SECRET COMMITMENT <<< \"$API_KEY\""}</p>
                <p className="mt-2 text-base-content/60"># Call the API</p>
                <p>{"curl -X POST https://backend.zkllmapi.com/chat \\"}</p>
                <p>{"  -H 'Content-Type: application/json' \\"}</p>
                <p>{"  -d '{\"nullifier\":\"'$NULLIFIER'\",\"secret\":\"'$SECRET'\",\"commitment\":\"'$COMMITMENT'\",\"message\":\"Hello\",...}'"}</p>
              </div>
            </details>
          </div>
        )}

        {/* Spent credits — collapsed */}
        {savedCredits.filter(c => c.spent).length > 0 && (
          <details className="mb-6">
            <summary className="text-sm text-base-content/40 cursor-pointer">
              {savedCredits.filter(c => c.spent).length} spent credit{savedCredits.filter(c => c.spent).length !== 1 ? "s" : ""}
            </summary>
            <div className="mt-2 space-y-2">
              {savedCredits.filter(c => c.spent).map((credit, i) => (
                <div key={i} className="bg-base-200 rounded-lg p-3 opacity-50">
                  <p className="font-mono text-xs break-all">{toApiKey(credit).slice(0, 40)}...</p>
                  <span className="badge badge-error badge-xs mt-1">spent</span>
                </div>
              ))}
            </div>
          </details>
        )}

        <div className="text-center text-xs text-base-content/30 mb-8">
          <a
            href={`https://basescan.org/address/${API_CREDITS_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-base-content/60"
          >
            View contract on Basescan ↗
          </a>
        </div>
      </div>
    </div>
  );
};

export default StakePage;
