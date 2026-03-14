"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.zkllmapi.com";

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

const MODELS = [
  { id: "llama-3.3-70b", label: "Llama 3.3 70B" },
  { id: "deepseek-r1-671b", label: "DeepSeek R1 671B" },
  { id: "mistral-31-24b", label: "Mistral 31 24B" },
  { id: "llama-3.1-405b", label: "Llama 3.1 405B" },
];

const CIRCUIT_URL =
  `${API_URL}/circuit`;

const ChatPage: NextPage = () => {
  const [credits, setCredits] = useState<StoredCredit[]>([]);
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [proofStatus, setProofStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const availableCredits = credits.filter(c => !c.spent);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("zk-credits");
      if (stored) {
        setCredits(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load credits:", e);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    if (availableCredits.length === 0) {
      setError("No available credits. Go to the Stake page to register more.");
      return;
    }

    setIsSending(true);
    setError(null);
    const userMessage = message.trim();
    setMessage("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    // Find first credit that exists on-chain (skip stale localStorage credits)
    let creditToUse = availableCredits[0];
    for (const credit of availableCredits) {
      const check = await fetch(`${API_URL}/merkle-path/${credit.commitment}`);
      if (check.ok) { creditToUse = credit; break; }
    }
    if (!creditToUse) {
      setError("No valid on-chain credits found. Please register a new credit on the Stake page.");
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
      const { UltraHonkBackend, Barretenberg, Fr } = await import("@aztec/bb.js");

      const bb = await Barretenberg.new({ threads: 1 });
      const noir = new Noir(circuit);
      const backend = new UltraHonkBackend(circuit.bytecode);

      // Helper: Fr → BigInt
      const frToBigInt = (fr: { value: Uint8Array }) =>
        BigInt("0x" + Array.from(fr.value).map((b: number) => b.toString(16).padStart(2, "0")).join(""));

      // Compute nullifier hash = poseidon2(nullifier)
      const nullifierBig = BigInt(creditToUse.nullifier);
      const nullifierHash = frToBigInt(await bb.poseidon2Hash([new Fr(nullifierBig)]));

      // Fetch merkle path from the API (already verified ok above)
      const pathRes = await fetch(`${API_URL}/merkle-path/${creditToUse.commitment}`);
      if (!pathRes.ok) throw new Error("Failed to fetch merkle path");
      const merkleData = await pathRes.json();
      if (merkleData.error) throw new Error("Merkle path error: " + merkleData.error);

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

      const { proof: proofBytes } = await backend.generateProof(witness);

      await bb.destroy();

      setProofStatus("Sending to API...");

      // Format proof as hex string and submit
      const proofHex = "0x" + Array.from(proofBytes).map((b: number) => b.toString(16).padStart(2, "0")).join("");
      const nullifierHashHex = "0x" + nullifierHash.toString(16).padStart(64, "0");
      const rootHex = "0x" + BigInt(merkleData.root).toString(16).padStart(64, "0");

      // Step 3: POST to API
      const apiRes = await fetch(`${API_URL}/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof: proofHex,
          nullifier_hash: nullifierHashHex,
          root: rootHex,
          depth: merkleData.depth,
          model: selectedModel,
          messages: [{ role: "user", content: userMessage }],
        }),
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        throw new Error(`API error (${apiRes.status}): ${errText}`);
      }

      const apiData = await apiRes.json();
      const assistantMessage = apiData.choices?.[0]?.message?.content || apiData.response || "No response";

      setMessages(prev => [...prev, { role: "assistant", content: assistantMessage }]);

      // Mark credit as spent
      const updatedCredits = credits.map(c => (c.commitment === creditToUse.commitment ? { ...c, spent: true } : c));
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
    <div className="flex items-center flex-col grow pt-6">
      <div className="px-4 max-w-3xl w-full flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">ZK Chat</h2>
          <div className="flex items-center gap-3">
            <span className="badge badge-info">
              {availableCredits.length} credit{availableCredits.length !== 1 ? "s" : ""} available
            </span>
          </div>
        </div>

        {/* Model Selector */}
        <div className="mb-4">
          <select
            className="select select-bordered w-full"
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 bg-base-100 rounded-xl p-4 shadow overflow-y-auto mb-4">
          {messages.length === 0 && !isSending && (
            <div className="flex items-center justify-center h-full text-base-content/40">
              <div className="text-center">
                <p className="text-4xl mb-4">🔐</p>
                <p>Send a message to start chatting privately.</p>
                <p className="text-sm mt-2">Your identity is hidden behind a ZK proof.</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}>
              <div className="chat-header text-xs text-base-content/50 mb-1">
                {msg.role === "user" ? "You" : selectedModel}
              </div>
              <div
                className={`chat-bubble ${
                  msg.role === "user" ? "chat-bubble-primary" : "chat-bubble-secondary"
                } whitespace-pre-wrap`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {proofStatus && (
            <div className="chat chat-start">
              <div className="chat-bubble chat-bubble-info flex items-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                {proofStatus}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error text-sm mb-3">
            <span>{error}</span>
            <button className="btn btn-ghost btn-xs" onClick={() => setError(null)}>
              ✕
            </button>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 mb-4">
          <textarea
            className="textarea textarea-bordered flex-1 min-h-[52px] max-h-[150px]"
            placeholder={
              availableCredits.length === 0 ? "No credits available — go to Stake to get some" : "Type your message..."
            }
            value={message}
            onChange={e => {
              setMessage(e.target.value);
              setError(null);
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isSending || availableCredits.length === 0}
          />
          <button
            className="btn btn-primary self-end"
            disabled={isSending || !message.trim() || availableCredits.length === 0}
            onClick={handleSend}
          >
            {isSending ? <span className="loading loading-spinner loading-sm"></span> : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
