"use client";

import { useCallback, useEffect, useState } from "react";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { createPublicClient, formatEther, http, parseAbiItem } from "viem";
import { base } from "viem/chains";
import { useAccount, useReadContract } from "wagmi";
import externalContracts from "~~/contracts/externalContracts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.zkllmapi.com";
const API_CREDITS_ADDRESS = "0x234d536e1623546F394707D6dB700f9c8CD29476";
const CLAWD_ADDRESS = "0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07";

const apiCreditsAbi = externalContracts[8453].APICredits.abi;
const clawdAbi = externalContracts[8453].CLAWDToken.abi;

const publicClient = createPublicClient({
  chain: base,
  transport: http("https://base-mainnet.g.alchemy.com/v2/8GVG8WjDs-sGFRr6Rm839"),
});

interface HealthData {
  status?: string;
  onChainRoot?: string;
  currentRoot?: string;
  nullifiersSpent?: number;
  spentNullifiers?: number;
}

interface StoredCredit {
  nullifier?: string;
  secret?: string;
  commitment: string;
  leafIndex: number;
  spent: boolean;
}

interface MerkleResponse {
  [key: string]: unknown;
}

interface CreditRegisteredEvent {
  user: string;
  index: bigint;
  commitment: bigint;
}

const truncate = (s: string, len = 16) => {
  if (!s) return "";
  if (s.length <= len + 4) return s;
  return `${s.slice(0, len)}…${s.slice(-4)}`;
};

const AdminPage: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  // --- Contract State ---
  const [treeData, setTreeData] = useState<{ size: bigint; depth: bigint; root: bigint } | null>(null);
  const [treeEmpty, setTreeEmpty] = useState(false);
  const [serverClaimable, setServerClaimable] = useState<bigint | null>(null);

  // --- API Server State ---
  const [healthData, setHealthData] = useState<HealthData>({});
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  // --- Wallet ---
  const { data: clawdBalance } = useReadContract({
    address: CLAWD_ADDRESS,
    abi: clawdAbi,
    functionName: "balanceOf",
    args: connectedAddress ? [connectedAddress] : undefined,
    chainId: 8453,
    query: { enabled: !!connectedAddress, refetchInterval: 10000 },
  });

  const { data: stakedBalance } = useReadContract({
    address: API_CREDITS_ADDRESS,
    abi: apiCreditsAbi,
    functionName: "stakedBalance",
    args: connectedAddress ? [connectedAddress] : undefined,
    chainId: 8453,
    query: { enabled: !!connectedAddress, refetchInterval: 10000 },
  });

  // --- Local Credits ---
  const [localCredits, setLocalCredits] = useState<StoredCredit[]>([]);
  const [merkleResults, setMerkleResults] = useState<Record<string, MerkleResponse | string>>({});
  const [merkleLoading, setMerkleLoading] = useState<Record<string, boolean>>({});

  // --- Raw Debug ---
  const [rawSelector, setRawSelector] = useState("");
  const [rawResult, setRawResult] = useState<string | null>(null);
  const [rawLoading, setRawLoading] = useState(false);

  // --- Recent Events ---
  const [recentEvents, setRecentEvents] = useState<CreditRegisteredEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // --- Refresh tick ---
  const [tick, setTick] = useState(0);

  const fetchContractState = useCallback(async () => {
    try {
      const result = await publicClient.readContract({
        address: API_CREDITS_ADDRESS,
        abi: apiCreditsAbi,
        functionName: "getTreeData",
      });
      const [size, depth, root] = result as [bigint, bigint, bigint];
      setTreeData({ size, depth, root });
      setTreeEmpty(false);
    } catch {
      setTreeEmpty(true);
      setTreeData(null);
    }

    try {
      const sc = await publicClient.readContract({
        address: API_CREDITS_ADDRESS,
        abi: apiCreditsAbi,
        functionName: "serverClaimable",
      });
      setServerClaimable(sc as bigint);
    } catch {
      setServerClaimable(null);
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      const data = await res.json();
      setHealthData(data);
      setHealthError(null);
    } catch (e) {
      setHealthError(String(e));
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock - 50000n > 0n ? currentBlock - 50000n : 0n;
      const logs = await publicClient.getLogs({
        address: API_CREDITS_ADDRESS,
        event: parseAbiItem(
          "event CreditRegistered(address indexed user, uint256 indexed index, uint256 commitment, uint256 newStakedBalance)",
        ),
        fromBlock,
        toBlock: "latest",
      });

      const events: CreditRegisteredEvent[] = logs
        .slice(-10)
        .reverse()
        .map(log => ({
          user: log.args.user as string,
          index: log.args.index as bigint,
          commitment: log.args.commitment as bigint,
        }));
      setRecentEvents(events);
    } catch (e) {
      console.error("Failed to fetch events:", e);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  // Load local credits from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("zk-credits");
      if (raw) {
        const parsed = JSON.parse(raw);
        setLocalCredits(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      setLocalCredits([]);
    }
  }, [tick]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchContractState();
    fetchHealth();
    fetchEvents();
    const interval = setInterval(() => {
      setTick(t => t + 1);
      fetchContractState();
      fetchHealth();
      fetchEvents();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchContractState, fetchHealth, fetchEvents]);

  const testMerklePath = async (commitment: string) => {
    setMerkleLoading(prev => ({ ...prev, [commitment]: true }));
    try {
      const res = await fetch(`${API_URL}/merkle-path/${commitment}`);
      const data = await res.json();
      setMerkleResults(prev => ({ ...prev, [commitment]: data }));
    } catch (e) {
      setMerkleResults(prev => ({ ...prev, [commitment]: `Error: ${e}` }));
    } finally {
      setMerkleLoading(prev => ({ ...prev, [commitment]: false }));
    }
  };

  const callRawContract = async () => {
    if (!rawSelector.trim()) return;
    setRawLoading(true);
    try {
      const result = await publicClient.call({
        to: API_CREDITS_ADDRESS,
        data: rawSelector.startsWith("0x") ? (rawSelector as `0x${string}`) : (`0x${rawSelector}` as `0x${string}`),
      });
      setRawResult(result.data || "0x (empty)");
    } catch (e) {
      setRawResult(`Error: ${e}`);
    } finally {
      setRawLoading(false);
    }
  };

  // Determine root match
  const onChainRoot = treeData ? treeData.root.toString() : null;
  const apiRoot = healthData.onChainRoot || healthData.currentRoot || null;
  const rootsMatch = onChainRoot && apiRoot ? onChainRoot === apiRoot : null;

  return (
    <div className="flex items-center flex-col grow pt-6 pb-12">
      <div className="px-4 max-w-4xl w-full space-y-6">
        <h1 className="text-2xl font-bold text-center font-mono">🔧 Admin Debug</h1>
        <p className="text-center text-base-content/50 text-sm">Auto-refreshes every 10s</p>

        {/* Section 1: Contract State */}
        <div className="bg-base-100 rounded-xl p-6 shadow">
          <h2 className="font-bold text-lg mb-4 border-b border-base-300 pb-2">📜 Contract State</h2>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-base-content/60">APICredits:</span>
              <a
                href={`https://basescan.org/address/${API_CREDITS_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary break-all"
              >
                {API_CREDITS_ADDRESS}
              </a>
            </div>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="text-base-content/60">CLAWD Token:</span>
              <a
                href={`https://basescan.org/address/${CLAWD_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary break-all"
              >
                {CLAWD_ADDRESS}
              </a>
            </div>
            <div className="divider my-1"></div>
            {treeEmpty ? (
              <div className="text-warning font-bold">⚠️ Empty tree (getTreeData reverted)</div>
            ) : treeData ? (
              <>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Tree Size:</span>
                  <span className="font-bold">{treeData.size.toString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content/60">Tree Depth:</span>
                  <span className="font-bold">{treeData.depth.toString()}</span>
                </div>
                <div className="flex justify-between flex-wrap gap-2">
                  <span className="text-base-content/60">Onchain Root:</span>
                  <span className="font-bold break-all">{treeData.root.toString()}</span>
                </div>
              </>
            ) : (
              <div className="text-base-content/40">Loading...</div>
            )}
            <div className="flex justify-between">
              <span className="text-base-content/60">Server Claimable:</span>
              <span className="font-bold">
                {serverClaimable !== null ? `${formatEther(serverClaimable)} CLAWD` : "..."}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: API Server State */}
        <div className="bg-base-100 rounded-xl p-6 shadow">
          <h2 className="font-bold text-lg mb-4 border-b border-base-300 pb-2">🌐 API Server State</h2>
          {healthLoading ? (
            <div className="text-base-content/40 font-mono text-sm">Loading...</div>
          ) : healthError ? (
            <div className="text-error font-mono text-sm">❌ Failed to reach API: {healthError}</div>
          ) : (
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-base-content/60">Status:</span>
                <span className={healthData.status === "ok" ? "text-success font-bold" : "text-warning font-bold"}>
                  {healthData.status || "unknown"}
                </span>
              </div>
              <div className="flex justify-between flex-wrap gap-2">
                <span className="text-base-content/60">API Root:</span>
                <span className="break-all">{apiRoot || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/60">Spent Nullifiers:</span>
                <span className="font-bold">
                  {healthData.spentNullifiers?.toString() ?? healthData.nullifiersSpent?.toString() ?? "N/A"}
                </span>
              </div>
              <div className="divider my-1"></div>
              <div className="flex justify-between items-center">
                <span className="text-base-content/60">Root Match:</span>
                {rootsMatch === null ? (
                  <span className="text-warning">⚠️ Cannot compare (missing data)</span>
                ) : rootsMatch ? (
                  <span className="text-success font-bold">✅ Match</span>
                ) : (
                  <div className="text-right">
                    <span className="text-error font-bold">❌ Mismatch</span>
                    <div className="text-xs mt-1">
                      <div>
                        Onchain: <span className="break-all">{onChainRoot}</span>
                      </div>
                      <div>
                        API: <span className="break-all">{apiRoot}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Your Wallet */}
        <div className="bg-base-100 rounded-xl p-6 shadow">
          <h2 className="font-bold text-lg mb-4 border-b border-base-300 pb-2">👛 Your Wallet</h2>
          {!connectedAddress ? (
            <div className="text-base-content/40 font-mono text-sm">Connect wallet to view</div>
          ) : (
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="text-base-content/60">Address:</span>
                <Address address={connectedAddress} />
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/60">CLAWD Balance:</span>
                <span className="font-bold">
                  {clawdBalance !== undefined ? `${formatEther(clawdBalance as bigint)} CLAWD` : "..."}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/60">Staked Balance:</span>
                <span className="font-bold">
                  {stakedBalance !== undefined ? `${formatEther(stakedBalance as bigint)} CLAWD` : "..."}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Local Credits */}
        <div className="bg-base-100 rounded-xl p-6 shadow">
          <h2 className="font-bold text-lg mb-4 border-b border-base-300 pb-2">🎫 Your Local Credits</h2>
          {localCredits.length === 0 ? (
            <div className="text-base-content/40 font-mono text-sm">No credits in localStorage (key: zk-credits)</div>
          ) : (
            <div className="space-y-4">
              {localCredits.map((credit, i) => (
                <div key={i} className="bg-base-200 rounded-lg p-4 font-mono text-sm space-y-2">
                  <div className="flex justify-between flex-wrap gap-2">
                    <span className="text-base-content/60">Commitment:</span>
                    <span className="break-all">{truncate(credit.commitment, 20)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Leaf Index:</span>
                    <span>{credit.leafIndex}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/60">Status:</span>
                    <span className={credit.spent ? "text-error font-bold" : "text-success font-bold"}>
                      {credit.spent ? "🔴 Spent" : "🟢 Unspent"}
                    </span>
                  </div>
                  {!credit.spent && (
                    <div>
                      <button
                        className="btn btn-xs btn-outline btn-primary mt-1"
                        disabled={merkleLoading[credit.commitment]}
                        onClick={() => testMerklePath(credit.commitment)}
                      >
                        {merkleLoading[credit.commitment] ? "Testing..." : "Test Merkle Path"}
                      </button>
                      {merkleResults[credit.commitment] && (
                        <pre className="mt-2 bg-base-300 rounded p-3 text-xs overflow-x-auto max-h-48 whitespace-pre-wrap">
                          {typeof merkleResults[credit.commitment] === "string"
                            ? (merkleResults[credit.commitment] as string)
                            : JSON.stringify(merkleResults[credit.commitment], null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Raw Debug */}
        <div className="bg-base-100 rounded-xl p-6 shadow">
          <h2 className="font-bold text-lg mb-4 border-b border-base-300 pb-2">🔬 Raw Debug</h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered input-sm flex-1 font-mono"
                placeholder="Function selector (e.g. 0x12345678)"
                value={rawSelector}
                onChange={e => setRawSelector(e.target.value)}
                onKeyDown={e => e.key === "Enter" && callRawContract()}
              />
              <button
                className="btn btn-sm btn-primary"
                disabled={rawLoading || !rawSelector.trim()}
                onClick={callRawContract}
              >
                {rawLoading ? "Calling..." : "Call Contract"}
              </button>
            </div>
            <p className="text-xs text-base-content/40">
              Calls APICredits ({truncate(API_CREDITS_ADDRESS, 10)}) with raw calldata
            </p>
            {rawResult && (
              <pre className="bg-base-200 rounded p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {rawResult}
              </pre>
            )}
          </div>
        </div>

        {/* Section 6: Recent Events */}
        <div className="bg-base-100 rounded-xl p-6 shadow">
          <h2 className="font-bold text-lg mb-4 border-b border-base-300 pb-2">📋 Recent CreditRegistered Events</h2>
          {eventsLoading ? (
            <div className="text-base-content/40 font-mono text-sm">Loading events...</div>
          ) : recentEvents.length === 0 ? (
            <div className="text-base-content/40 font-mono text-sm">No events found in recent blocks</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-xs font-mono">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Index</th>
                    <th>Commitment</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((evt, i) => (
                    <tr key={i} className="hover">
                      <td>
                        <Address address={evt.user} />
                      </td>
                      <td>{evt.index.toString()}</td>
                      <td className="break-all">{truncate(evt.commitment.toString(), 20)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
