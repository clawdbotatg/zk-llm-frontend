"use client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://backend.zkllmapi.com";

import { useEffect, useRef, useState } from "react";
import type { NextPage } from "next";

interface StoredCredit {
  nullifier: string;
  secret: string;
  commitment: string;
  leafIndex: number;
  spent: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MODEL = "zai-org-glm-5";

const CIRCUIT_URL = `${API_URL}/circuit`;
const PROOF_DEPTH = 16;

interface TreeData {
  leaves: string[];
  levels: string[][];
  root: string;
  depth: number;
  zeros: string[];
}

/**
 * Compute the Merkle sibling path for a commitment from full tree data.
 * Called client-side so the server never learns which commitment is being used.
 */
function computeMerklePath(treeData: TreeData, commitment: string) {
  const leafIndex = treeData.leaves.findIndex((l) => l === commitment);
  if (leafIndex === -1) return null;

  const { levels, depth, zeros, root } = treeData;
  const siblings: string[] = [];
  const indices: number[] = [];
  let currentIndex = leafIndex;

  for (let i = 0; i < PROOF_DEPTH; i++) {
    if (i < depth) {
      const siblingIndex = currentIndex ^ 1;
      siblings.push(levels[i][siblingIndex]);
    } else {
      siblings.push(zeros[i]);
    }
    indices.push((leafIndex >> i) & 1);
    currentIndex = currentIndex >> 1;
  }

  return { leafIndex, siblings, indices, root, depth };
}

const ChatPage: NextPage = () => {
  const [credits, setCredits] = useState<StoredCredit[]>([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [proofStatus, setProofStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const availableCredits = credits.filter((c) => !c.spent);

  // Load credits + persisted chat history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zk-credits");
      if (stored) setCredits(JSON.parse(stored));
      const history = localStorage.getItem("zk-chat-history");
      if (history) setMessages(JSON.parse(history));
    } catch (e) {
      console.error("Failed to load from localStorage:", e);
    }
  }, []);

  // Persist chat history whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("zk-chat-history", JSON.stringify(messages));
    }
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("zk-chat-history");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    if (availableCredits.length === 0) {
      setError("No available credits. Go to the Buy page to purchase more.");
      return;
    }

    setIsSending(true);
    setError(null);
    const userMessage = message.trim();
    setMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    // Find first credit that: (1) exists onchain, (2) nullifier not spent
    // Pre-load bb.js to compute nullifier hashes for spent check
    const { Barretenberg: BB2, Fr: Fr2 } = await import("@aztec/bb.js");
    const bbCheck = await BB2.new({ threads: 1 });
    const frToBI = (fr: { value: Uint8Array }) =>
      BigInt(
        "0x" +
          Array.from(fr.value)
            .map((b: number) => b.toString(16).padStart(2, "0"))
            .join(""),
      );

    let creditToUse: (typeof availableCredits)[0] | null = null;
    const staleCredits: string[] = [];

    // Fetch the full tree once — client computes paths locally so the server
    // never learns which commitment is about to be used (privacy fix).
    const treeRes = await fetch(`${API_URL}/tree`);
    if (!treeRes.ok) throw new Error("Failed to fetch tree data");
    const treeData: TreeData = await treeRes.json();
    const treeLeafSet = new Set(treeData.leaves);
    console.log(
      "[DEBUG chat] credits from state:",
      credits.length,
      credits.map((c) => ({
        commitment: c.commitment.slice(0, 20),
        spent: c.spent,
      })),
    );
    console.log("[DEBUG chat] availableCredits:", availableCredits.length);
    console.log("[DEBUG chat] tree has", treeLeafSet.size, "leaves");

    // Compute all nullifier hashes upfront
    const nullifierHashes = new Map<string, string>(); // commitment → nullifierHashHex
    for (const credit of availableCredits) {
      if (!treeLeafSet.has(credit.commitment)) {
        staleCredits.push(credit.commitment);
        console.log(
          "[DEBUG chat] commitment",
          credit.commitment.slice(0, 20),
          "NOT in tree — marking stale",
        );
        continue;
      }
      console.log(
        "[DEBUG chat] commitment",
        credit.commitment.slice(0, 20),
        "FOUND in tree",
      );
      const nullifierHash = frToBI(
        await bbCheck.poseidon2Hash([new Fr2(BigInt(credit.nullifier))]),
      );
      nullifierHashes.set(
        credit.commitment,
        "0x" + nullifierHash.toString(16).padStart(64, "0"),
      );
    }
    await bbCheck.destroy();

    // Check all nullifiers in parallel (privacy: server sees them all at once,
    // can't tell which one you're about to use)
    const creditsToCheck = availableCredits.filter((c) =>
      nullifierHashes.has(c.commitment),
    );
    if (creditsToCheck.length > 0) {
      const spentResults = await Promise.all(
        creditsToCheck.map((c) =>
          fetch(
            `${API_URL}/nullifier/${nullifierHashes.get(c.commitment)}`,
          ).then((r) => r.json()),
        ),
      );
      for (let i = 0; i < creditsToCheck.length; i++) {
        console.log(
          "[DEBUG chat] nullifier",
          nullifierHashes.get(creditsToCheck[i].commitment)?.slice(0, 20),
          "spent?",
          spentResults[i].spent,
        );
        if (spentResults[i].spent) {
          staleCredits.push(creditsToCheck[i].commitment);
        } else if (!creditToUse) {
          creditToUse = creditsToCheck[i];
        }
      }
    }

    console.log(
      "[DEBUG chat] staleCredits:",
      staleCredits.length,
      "creditToUse:",
      creditToUse?.commitment?.slice(0, 20),
    );

    // Mark stale credits as spent in localStorage
    if (staleCredits.length > 0) {
      const updated = credits.map((c) =>
        staleCredits.includes(c.commitment) ? { ...c, spent: true } : c,
      );
      setCredits(updated);
      localStorage.setItem("zk-credits", JSON.stringify(updated));
    }

    if (!creditToUse) {
      setError(
        "No valid unspent credits found. Please buy a new one on the Buy page.",
      );
      setIsSending(false);
      return;
    }

    try {
      // Step 1: Fetch current root from health endpoint
      setProofStatus("Fetching current root...");
      const healthRes = await fetch(`${API_URL}/health`);
      await healthRes.json(); // ensure server is reachable

      // Step 2: Load circuit and generate proof
      setProofStatus("Loading ZK circuit (this may take a moment)...");

      const circuitRes = await fetch(CIRCUIT_URL);
      const circuit = await circuitRes.json();

      setProofStatus("Initializing proof system...");
      const { Noir } = await import("@noir-lang/noir_js");
      const { UltraHonkBackend, Barretenberg, Fr } = await import(
        "@aztec/bb.js"
      );

      const bb = await Barretenberg.new({ threads: 1 });
      const noir = new Noir(circuit);
      const backend = new UltraHonkBackend(circuit.bytecode);

      // Helper: Fr → BigInt
      const frToBigInt = (fr: { value: Uint8Array }) =>
        BigInt(
          "0x" +
            Array.from(fr.value)
              .map((b: number) => b.toString(16).padStart(2, "0"))
              .join(""),
        );

      // Compute nullifier hash = poseidon2(nullifier)
      const nullifierBig = BigInt(creditToUse.nullifier);
      const nullifierHash = frToBigInt(
        await bb.poseidon2Hash([new Fr(nullifierBig)]),
      );

      // Compute merkle path locally from treeData (already fetched above — no per-commitment request)
      const merkleData = computeMerklePath(treeData, creditToUse.commitment);
      if (!merkleData) throw new Error("Commitment not found in tree");

      setProofStatus("Generating ZK proof (takes 10-30s)...");

      const { witness } = await noir.execute({
        nullifier_hash: nullifierHash.toString(),
        root: merkleData.root,
        depth: merkleData.depth,
        nullifier: creditToUse.nullifier,
        secret: creditToUse.secret,
        indices: merkleData.indices.map(String),
        siblings: merkleData.siblings.map(String),
      });

      const { proof: proofBytes, publicInputs } =
        await backend.generateProof(witness);

      await bb.destroy();

      setProofStatus("Sending to API...");

      // Format proof as hex string and submit
      const proofHex =
        "0x" +
        Array.from(proofBytes)
          .map((b: number) => b.toString(16).padStart(2, "0"))
          .join("");
      const nullifierHashHex =
        "0x" + nullifierHash.toString(16).padStart(64, "0");
      const rootHex =
        "0x" + BigInt(merkleData.root).toString(16).padStart(64, "0");

      // Step 3: POST to API
      const apiRes = await fetch(`${API_URL}/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof: proofHex,
          publicInputs,
          nullifier_hash: nullifierHashHex,
          root: rootHex,
          depth: merkleData.depth,
          model: MODEL,
          messages: [{ role: "user", content: userMessage }],
        }),
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        // If nullifier already spent, mark it in localStorage and surface a clear message
        if (apiRes.status === 403 && errText.includes("already spent")) {
          const updatedCredits = credits.map((c) =>
            c.commitment === creditToUse.commitment ? { ...c, spent: true } : c,
          );
          setCredits(updatedCredits);
          localStorage.setItem("zk-credits", JSON.stringify(updatedCredits));
          throw new Error(
            "This credit was already used. Please buy a new one on the Buy page.",
          );
        }
        throw new Error(`API error (${apiRes.status}): ${errText}`);
      }

      const apiData = await apiRes.json();
      const assistantMessage =
        apiData.choices?.[0]?.message?.content ||
        apiData.response ||
        "No response";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantMessage },
      ]);

      // Mark credit as spent
      const updatedCredits = credits.map((c) =>
        c.commitment === creditToUse.commitment ? { ...c, spent: true } : c,
      );
      setCredits(updatedCredits);
      localStorage.setItem("zk-credits", JSON.stringify(updatedCredits));

      setProofStatus("");
    } catch (e: any) {
      console.error("Chat error:", e);
      setError(e?.message || "Failed to send message");
      setProofStatus("");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="flex flex-col relative"
      style={{
        height: "calc(100vh - 56px)",
        backgroundImage: "url(/hero-chat.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      <div className="absolute inset-0 bg-black/75" />
      <div className="relative z-10 flex flex-col h-full">
        {/* Top bar */}
        <div className="border-b border-[#1f1f1f] px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono font-bold">ZK CHAT</span>
            <span className="text-xs font-mono text-base-content/30">·</span>
            <span className="text-xs font-mono text-base-content/50">
              zai-org-glm-5
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-base-content/30">
              {availableCredits.length} credit
              {availableCredits.length !== 1 ? "s" : ""} left
            </span>
            {messages.length > 0 && (
              <button
                className="cursor-pointer text-xs font-mono text-base-content/20 hover:text-error transition-colors"
                onClick={clearChat}
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {messages.length === 0 && !isSending && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-xs font-mono text-base-content/20 tracking-widest mb-3">
                  PRIVATE LLM TERMINAL
                </p>
                <p className="font-mono text-base-content/40 text-sm mb-1">
                  Your identity is hidden behind a ZK proof.
                </p>
                <p className="font-mono text-base-content/20 text-xs">
                  {availableCredits.length === 0
                    ? "→ Go to /buy to get credits first"
                    : `${availableCredits.length} credit${availableCredits.length !== 1 ? "s" : ""} ready. Start typing below.`}
                </p>
              </div>
            </div>
          )}

          {availableCredits.length > 0 && availableCredits.length <= 5 && (
            <div className="max-w-3xl mx-auto mb-4">
              <div className="border border-yellow-500/20 bg-yellow-500/5 px-4 py-2 text-center">
                <span className="text-xs font-mono text-yellow-500/70">
                  ⚠️ Small anonymity set — privacy improves as more people use
                  the system
                </span>
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] ${msg.role === "user" ? "" : ""}`}>
                  <p
                    className={`text-xs font-mono mb-2 ${msg.role === "user" ? "text-right text-base-content/30" : "text-[#42F38F]/60"}`}
                  >
                    {msg.role === "user" ? "YOU" : "zai-org-glm-5"}
                  </p>
                  <div
                    className={`font-mono text-sm leading-relaxed whitespace-pre-wrap px-4 py-3 border ${
                      msg.role === "user"
                        ? "border-primary/20 bg-primary/5 text-base-content/80 text-right"
                        : "border-[#222] bg-[#111] text-base-content/80"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {proofStatus && (
              <div className="flex justify-start">
                <div className="border border-[#222] bg-[#111] px-4 py-3 flex items-center gap-3">
                  <span className="loading loading-spinner loading-xs text-primary"></span>
                  <span className="text-xs font-mono text-base-content/40">
                    {proofStatus}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="border-t border-error/20 bg-error/5 px-6 py-3 flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-mono text-error">{error}</span>
            <button
              className="cursor-pointer text-xs font-mono text-base-content/30 hover:text-base-content transition-colors"
              onClick={() => setError(null)}
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-[#1f1f1f] px-6 py-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto mb-2 flex items-center justify-between">
            <span className="font-mono text-xs text-base-content/30">
              {availableCredits.length === 0 ? (
                <span className="text-[#F14E47]/70">
                  no credits —{" "}
                  <a href="/buy" className="underline hover:text-[#F14E47]">
                    buy some
                  </a>
                </span>
              ) : (
                <span>
                  {availableCredits.length} credit
                  {availableCredits.length !== 1 ? "s" : ""} left
                </span>
              )}
            </span>
          </div>
          <div className="max-w-3xl mx-auto flex gap-3">
            <textarea
              className="flex-1 bg-[#111] border border-[#333] text-base-content font-mono text-sm px-4 py-3 focus:outline-none focus:border-primary/40 transition-colors resize-none min-h-[48px] max-h-[140px]"
              placeholder={
                availableCredits.length === 0
                  ? "No credits — go to /buy to get some"
                  : "Type your message... (Enter to send)"
              }
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isSending || availableCredits.length === 0}
              rows={1}
            />
            <button
              className="cursor-pointer font-mono text-sm bg-primary text-black font-bold px-5 py-3 hover:bg-primary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed self-end flex items-center gap-2"
              disabled={
                isSending || !message.trim() || availableCredits.length === 0
              }
              onClick={handleSend}
            >
              {isSending ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                "SEND →"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
