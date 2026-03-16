"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { formatEther, parseEther, parseUnits, formatUnits } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useBalance } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import externalContracts from "~~/contracts/externalContracts";

const API_CREDITS_ADDRESS = "0xFc137f8a2E4ca655084731B5eeeF424BEcdae86C";
const CLAWD_ROUTER_ADDRESS = "0x1b60CfCe6ddBD2A8f4c5bf83b8bc66f9ef683BC7";
const CLAWD_ADDRESS = "0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const apiCreditsAbi = externalContracts[8453].APICredits.abi;
const clawdAbi = externalContracts[8453].CLAWDToken.abi;
const routerAbi = externalContracts[8453].CLAWDRouter.abi;
const pricingAbi = externalContracts[8453].CLAWDPricing.abi;
const usdcAbi = externalContracts[8453].USDC.abi;

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
  const [numCreditsInput, setNumCreditsInput] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState<'clawd'|'usdc'|'eth'>('clawd');
  const [isApproving, setIsApproving] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [registeredCredit, setRegisteredCredit] = useState<StoredCredit | null>(null);
  const [savedCredits, setSavedCredits] = useState<StoredCredit[]>([]);
  const [clawdPriceUsd, setClawdPriceUsd] = useState<number | null>(null);
  const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [approveCooldown, setApproveCooldown] = useState(false);
  const [approveConfirmed, setApproveConfirmed] = useState(false); // true after onchain confirmation

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
    args: connectedAddress ? [connectedAddress, CLAWD_ROUTER_ADDRESS] : undefined,
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

  // ETH balance
  const { data: ethBalance } = useBalance({
    address: connectedAddress,
    chainId: 8453,
    query: { enabled: !!connectedAddress },
  });

  // USDC balance
  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: connectedAddress ? [connectedAddress] : undefined,
    chainId: 8453,
    query: { enabled: !!connectedAddress },
  });

  // USDC allowance to router
  const { data: usdcAllowance, refetch: refetchUsdcAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: usdcAbi,
    functionName: "allowance",
    args: connectedAddress ? [connectedAddress, CLAWD_ROUTER_ADDRESS] : undefined,
    chainId: 8453,
    query: { enabled: !!connectedAddress },
  });

  // CLAWDPricing: creditPriceUSD, ETH/USD, and dynamic CLAWD/credit
  const { data: creditPriceUSD } = useReadContract({
    address: externalContracts[8453].CLAWDPricing.address,
    abi: pricingAbi,
    functionName: "creditPriceUSD",
    chainId: 8453,
  });
  const { data: ethUsdPrice } = useReadContract({
    address: externalContracts[8453].CLAWDPricing.address,
    abi: pricingAbi,
    functionName: "getEthUsdPrice",
    chainId: 8453,
  });
  // Dynamic CLAWD per credit from oracle (replaces static pricePerCredit for display + payment)
  const { data: clawdPerCreditOracle } = useReadContract({
    address: externalContracts[8453].CLAWDPricing.address,
    abi: pricingAbi,
    functionName: "getCreditPriceInCLAWD",
    chainId: 8453,
  });

  // Router quote for N credits — primary price source (returns [clawdAmount, usdEquivalent])
  const numCredits = Math.max(0, parseInt(numCreditsInput) || 0);
  const { data: quoteData } = useReadContract({
    address: CLAWD_ROUTER_ADDRESS,
    abi: routerAbi,
    functionName: "quoteCredits",
    args: [BigInt(Math.max(1, numCredits))],
    chainId: 8453,
  });

  const { writeContractAsync } = useWriteContract();

  // Wait for approve tx confirmation
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  // When approve tx is confirmed onchain, mark approved and refetch
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

  // Use router quote as primary price, oracle as fallback — no hardcoded fallback
  const contractPrice = quoteData
    ? (quoteData as [bigint, bigint])[0] / BigInt(Math.max(1, numCredits))
    : clawdPerCreditOracle
    ? (clawdPerCreditOracle as bigint)
    : 0n;
  const stakeAmountBigInt = quoteData
    ? (quoteData as [bigint, bigint])[0]
    : contractPrice * BigInt(numCredits);

  // ETH cost estimate: numCredits * creditPriceUSD / ethUsdPrice (both 18 decimals)
  const creditPriceUSDVal = creditPriceUSD ? (creditPriceUSD as bigint) : 10000000000000000n; // $0.01
  const ethUsdVal = ethUsdPrice ? (ethUsdPrice as bigint) : 1900n * 10n ** 18n;
  const ethCostExact = numCredits > 0 ? (creditPriceUSDVal * BigInt(numCredits) * 10n ** 18n) / ethUsdVal : 0n;
  const ethCostWithSlippage = ethCostExact * 115n / 100n; // +15% slippage buffer (oracle vs pool price drift)

  // USDC cost estimate: numCredits * creditPriceUSD (18 dec) → convert to 6 dec USDC
  const usdcCostExact = numCredits > 0 ? (creditPriceUSDVal * BigInt(numCredits)) / 10n ** 12n : 0n; // 18→6 decimals
  const usdcCostWithSlippage = usdcCostExact * 102n / 100n;

  // minCLAWDOut for slippage protection (2% below expected)
  const minCLAWDOut = stakeAmountBigInt; // exact CLAWD needed — router checks clawdReceived >= totalCLAWD

  // needsApproval depends on payment method
  const needsClawdApproval = paymentMethod === 'clawd' && !approveConfirmed &&
    stakeAmountBigInt > 0n &&
    (!allowance || (allowance as bigint) < stakeAmountBigInt);

  const needsUsdcApproval = paymentMethod === 'usdc' && !approveConfirmed &&
    usdcCostWithSlippage > 0n &&
    (!usdcAllowance || (usdcAllowance as bigint) < usdcCostWithSlippage);

  const needsApproval = needsClawdApproval || needsUsdcApproval;

  // Once allowance catches up, clear the approveConfirmed override
  useEffect(() => {
    if (approveConfirmed && allowance && (allowance as bigint) >= stakeAmountBigInt && stakeAmountBigInt > 0n) {
      setApproveConfirmed(false);
    }
  }, [approveConfirmed, allowance, stakeAmountBigInt]);

  // Reset approveConfirmed if user changes credit count
  useEffect(() => {
    setApproveConfirmed(false);
  }, [numCreditsInput]);

  const handleApprove = async () => {
    if (!connectedAddress) return;
    setIsApproving(true);
    setTxError(null);
    try {
      let hash;
      if (paymentMethod === 'usdc') {
        hash = await writeContractAsync({
          address: USDC_ADDRESS,
          abi: usdcAbi,
          functionName: "approve",
          args: [CLAWD_ROUTER_ADDRESS, usdcCostWithSlippage],
        });
      } else {
        // CLAWD approval targets CLAWDRouter (not APICredits directly)
        const maxCLAWD = stakeAmountBigInt * 105n / 100n;
        hash = await writeContractAsync({
          address: CLAWD_ADDRESS,
          abi: clawdAbi,
          functionName: "approve",
          args: [CLAWD_ROUTER_ADDRESS, maxCLAWD],
        });
      }
      setApproveTxHash(hash);
      setApproveCooldown(true);
      setTimeout(() => setApproveCooldown(false), 10000);
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
      const numCredits = Number(numCreditsInput) || 0;
      if (numCredits === 0) { setTxError("Enter at least 1 credit."); return; }

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

      // ONE transaction: pay + register credits
      notification.success(`Buying ${numCredits} credit${numCredits > 1 ? "s" : ""} via ${paymentMethod.toUpperCase()}...`);

      if (paymentMethod === 'eth') {
        await writeContractAsync({
          address: CLAWD_ROUTER_ADDRESS,
          abi: routerAbi,
          functionName: "buyWithETH",
          args: [commitments, minCLAWDOut],
          value: ethCostWithSlippage,
        });
      } else if (paymentMethod === 'usdc') {
        await writeContractAsync({
          address: CLAWD_ROUTER_ADDRESS,
          abi: routerAbi,
          functionName: "buyWithUSDC",
          args: [commitments, usdcCostWithSlippage, minCLAWDOut],
        });
      } else {
        // CLAWD payment via CLAWDRouter — +5% slippage buffer on maxCLAWD
        const maxCLAWD = stakeAmountBigInt * 105n / 100n;
        await writeContractAsync({
          address: CLAWD_ROUTER_ADDRESS,
          abi: routerAbi,
          functionName: "buyWithCLAWD",
          args: [commitments, maxCLAWD],
        });
      }

      // Save all new credits to localStorage
      const existing = JSON.parse(localStorage.getItem("zk-credits") || "[]");
      const all = [...existing, ...newCredits];
      localStorage.setItem("zk-credits", JSON.stringify(all));
      setSavedCredits(all);
      setRegisteredCredit(newCredits[newCredits.length - 1]);

      notification.success(`✅ ${numCredits} credit${numCredits > 1 ? "s" : ""} ready to use!`);
      setNumCreditsInput("1");
      setTimeout(() => { refetchStaked(); refetchBalance(); refetchAllowance(); refetchUsdcBalance(); refetchUsdcAllowance(); }, 3000);
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


  const availableCredits = savedCredits.filter(c => !c.spent);

  // Format a credit as a portable API key string
  const toApiKey = (c: StoredCredit) => {
    const raw = `${c.nullifier}:${c.secret}:${c.commitment}`;
    const b64 = btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return `zk-llm-${b64}`;
  };

    return (
    <div className="relative min-h-[calc(100vh-56px)]" style={{backgroundImage: "url(/hero-stake.jpg)", backgroundSize: "cover", backgroundPosition: "center"}}>
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative z-10">
    <div className="max-w-2xl mx-auto px-6 pt-8 pb-16">

      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-mono text-primary mb-3 tracking-widest">BUY CREDITS</p>
        <h1 className="text-4xl font-mono font-bold mb-3">Get API Access</h1>
        <p className="font-mono text-base-content/50 text-sm">
          One credit = one private LLM call. No account. No identity.
          {quoteData
            ? ` · ~$${Number(formatEther((quoteData as [bigint, bigint])[1] / BigInt(Math.max(1, numCredits)))).toFixed(4)} per credit`
            : creditPriceUSD
            ? ` · ~$${Number(formatEther(creditPriceUSD as bigint)).toFixed(4)} per credit`
            : ""}
        </p>
      </div>

      {/* Buy box */}
      <div className="border border-[#222] mb-6">
        {/* Balance row */}
        {connectedAddress && (
          <div className="border-b border-[#222] px-5 py-3 flex justify-between items-center">
            <span className="text-xs font-mono text-base-content/40">YOUR BALANCE</span>
            <span className="text-sm font-mono text-base-content/70">
              {paymentMethod === 'eth' && ethBalance
                ? `${Number(ethBalance.formatted).toFixed(4)} ETH`
                : paymentMethod === 'usdc' && usdcBalance !== undefined
                ? `${Number(formatUnits(usdcBalance as bigint, 6)).toLocaleString(undefined, {maximumFractionDigits: 2})} USDC`
                : clawdBalance !== undefined
                ? `${Number(formatEther(clawdBalance as bigint)).toLocaleString()} CLAWD`
                : "—"}
            </span>
          </div>
        )}

        <div className="p-5">
          {/* Credit count input */}
          <div className="mb-4">
            <label className="text-xs font-mono text-base-content/40 block mb-2">HOW MANY CREDITS?</label>
            <div className="flex items-center gap-3">
              <button className="font-mono text-xl px-4 py-3 border border-[#333] bg-[#111] hover:border-[#F14E47] transition-colors w-12 text-center"
                onClick={() => { setNumCreditsInput(n => String(Math.max(1, (parseInt(n)||1)-1))); setTxError(null); }}>−</button>
              <input
                type="number"
                min="1"
                className="flex-1 bg-[#111] border border-[#333] text-base-content font-mono text-xl px-4 py-3 focus:outline-none focus:border-[#F14E47] transition-colors text-center"
                value={numCreditsInput}
                onChange={e => { setNumCreditsInput(e.target.value); setTxError(null); }}
              />
              <button className="font-mono text-xl px-4 py-3 border border-[#333] bg-[#111] hover:border-[#F14E47] transition-colors w-12 text-center"
                onClick={() => { setNumCreditsInput(n => String((parseInt(n)||0)+1)); setTxError(null); }}>+</button>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="border border-[#222] bg-black/40 px-4 py-3 mb-5 font-mono text-sm">
            <div className="flex justify-between text-base-content/50 mb-1">
              <span>Price per credit</span>
              <span>
                {paymentMethod === 'eth'
                  ? `~${Number(formatEther(ethCostExact / BigInt(Math.max(numCredits,1)))).toFixed(6)} ETH`
                  : paymentMethod === 'usdc'
                  ? `~$${Number(formatUnits(usdcCostExact / BigInt(Math.max(numCredits,1)), 6)).toFixed(4)} USDC`
                  : `${Number(formatEther(contractPrice)).toLocaleString(undefined, {maximumFractionDigits: 2})} CLAWD`}
              </span>
            </div>
            <div className="flex justify-between text-base-content font-bold">
              <span>Total ({numCredits} credit{numCredits !== 1 ? "s" : ""})</span>
              <span>
                {paymentMethod === 'eth'
                  ? `~${Number(formatEther(ethCostWithSlippage)).toFixed(6)} ETH`
                  : paymentMethod === 'usdc'
                  ? `~$${Number(formatUnits(usdcCostWithSlippage, 6)).toFixed(4)} USDC`
                  : `${numCredits > 0 ? Number(formatEther(stakeAmountBigInt)).toLocaleString() : "0"} CLAWD`}
              </span>
            </div>
          </div>

          {/* Payment method */}
          <div className="flex gap-2 mb-5">
            {(['clawd', 'usdc', 'eth'] as const).map(m => (
              <button
                key={m}
                className={`flex-1 font-mono text-xs py-2 border transition-colors ${paymentMethod === m ? 'border-[#F14E47] text-[#F14E47] bg-[#F14E47]/10' : 'border-[#333] text-base-content/40 hover:border-[#555]'}`}
                onClick={() => { setPaymentMethod(m); setApproveConfirmed(false); setTxError(null); }}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Action button */}
          {!connectedAddress ? (
            <RainbowKitCustomConnectButton />
          ) : wrongNetwork ? (
            <button
              className="w-full font-mono text-sm border border-yellow-500/50 text-yellow-400 px-6 py-3 hover:bg-yellow-500/10 transition-colors"
              onClick={() => switchChain({ chainId: 8453 })}
            >
              SWITCH TO BASE →
            </button>
          ) : needsApproval ? (
            <button
              className="w-full font-mono text-sm bg-[#0a0a1a] border border-[#F14E47] text-[#42F38F] px-6 py-3 hover:bg-[#F14E47]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={approveLoading || stakeAmountBigInt === 0n}
              onClick={handleApprove}
            >
              {approveLoading && <span className="loading loading-spinner loading-xs"></span>}
              {approveLoading ? "APPROVING..." : `APPROVE ${paymentMethod === 'usdc' ? 'USDC' : 'CLAWD'} →`}
            </button>
          ) : (
            <button
              className="w-full font-mono text-sm bg-[#F14E47] text-black font-bold px-6 py-3 hover:bg-[#d43d37] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isStaking || stakeAmountBigInt === 0n || numCredits === 0}
              onClick={handleStake}
            >
              {isStaking && <span className="loading loading-spinner loading-xs"></span>}
              {isStaking
                ? "BUYING..."
                : `BUY ${numCredits > 0 ? numCredits : ""} CREDIT${numCredits !== 1 ? "S" : ""} →`}
            </button>
          )}

          {txError && (
            <div className="mt-3 border border-error/30 bg-error/5 px-4 py-3 text-xs font-mono text-error">
              {txError}
            </div>
          )}
        </div>
      </div>

      {/* API Keys */}
      {availableCredits.length > 0 && (
        <div className="border border-[#222] mb-6">
          <div className="border-b border-[#222] px-5 py-3 flex justify-between items-center">
            <span className="text-xs font-mono text-base-content/40">YOUR API KEYS</span>
            <span className="text-xs font-mono text-success">{availableCredits.length} AVAILABLE</span>
          </div>
          <div className="p-5">
            <p className="text-xs font-mono text-base-content/40 mb-4">
              Each key works once. Store them safely — they cannot be recovered.
            </p>
            <div className="space-y-3">
              {availableCredits.map((credit, i) => (
                <div key={i} className="border border-[#222] bg-[#111]">
                  <div className="border-b border-[#222] px-3 py-2 flex justify-between items-center">
                    <span className="text-xs font-mono text-base-content/30">KEY #{i + 1}</span>
                    <button
                      className="text-xs font-mono text-[#42F38F]/60 hover:text-primary transition-colors"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(toApiKey(credit));
                          notification.success("Copied!");
                        } catch {
                          const el = document.createElement("textarea");
                          el.value = toApiKey(credit);
                          document.body.appendChild(el);
                          el.select();
                          document.execCommand("copy");
                          document.body.removeChild(el);
                          notification.success("Copied!");
                        }
                      }}
                    >
                      COPY ↗
                    </button>
                  </div>
                  <div className="px-3 py-2">
                    <p className="font-mono text-xs text-base-content/40 break-all">
                      {toApiKey(credit).slice(0, 48)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Usage */}
            <details className="mt-5">
              <summary className="text-xs font-mono text-base-content/30 cursor-pointer hover:text-base-content/60 transition-colors">
                HOW TO USE IN A SCRIPT ↓
              </summary>
              <div className="mt-3 border border-[#222] bg-[#111] overflow-x-auto">
                <pre className="p-4 text-xs font-mono text-base-content/50 leading-relaxed">{`API_KEY="zk-llm-<your-key>"

curl -X POST https://backend.zkllmapi.com/v1/chat \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'
  
# The server decodes your key automatically.
# Each key works once — use it when you need it.

IFS='_' read -r _ N S C <<< "$API_KEY"
curl -X POST https://backend.zkllmapi.com/chat \\
  -H 'Content-Type: application/json' \\
  -d '{"nullifier":"'$N'","secret":"'$S'","commitment":"'$C'","message":"Hello"}'`}</pre>
              </div>
            </details>
          </div>
        </div>
      )}

      {/* Spent */}
      {savedCredits.filter(c => c.spent).length > 0 && (
        <details className="mb-6">
          <summary className="text-xs font-mono text-base-content/30 cursor-pointer hover:text-base-content/50 transition-colors">
            {savedCredits.filter(c => c.spent).length} SPENT CREDIT{savedCredits.filter(c => c.spent).length !== 1 ? "S" : ""} ↓
          </summary>
          <div className="mt-3 space-y-2">
            {savedCredits.filter(c => c.spent).map((credit, i) => (
              <div key={i} className="border border-[#1a1a1a] px-3 py-2 opacity-40">
                <p className="font-mono text-xs text-base-content/50 break-all">{toApiKey(credit).slice(0, 48)}...</p>
                <span className="text-xs font-mono text-error">SPENT</span>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="text-xs font-mono text-base-content/20 mt-8">
        <a
          href={`https://basescan.org/address/${API_CREDITS_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#42F38F]/60 transition-colors"
        >
          VIEW CONTRACT ON BASESCAN ↗
        </a>
      </div>
    </div>
      </div>
    </div>
  );
};

export default StakePage;
