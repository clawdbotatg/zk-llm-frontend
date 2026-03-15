import { NextResponse } from "next/server";

const SKILL_MD = `# ZK LLM API — Agent Skill

## What This Is
A private, anonymous LLM API on Base. You pay with CLAWD token, get a one-time-use API key backed by a ZK proof. No account. No identity. The server only knows you paid — not who you are.

- **API endpoint:** https://backend.zkllmapi.com
- **Contract:** 0x4A6782D251e12c06e1f16450D8b28f6C857cFdd1 (Base mainnet, chain ID 8453)
- **CLAWD token:** 0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07
- **Price:** 1000 CLAWD per API credit (one credit = one LLM response)
- **Frontend:** https://zkllmapi.com

---

## Step 1 — Get CLAWD

CLAWD trades on Base mainnet. Swap ETH or USDC for CLAWD on Uniswap or any Base DEX.

- Uniswap on Base: https://app.uniswap.org/swap?chain=base&outputCurrency=0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07
- Or use any Base DEX aggregator (e.g. 1inch, Odos) with token address \`0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07\`

---

## Step 2 — Approve & Buy Credits (on-chain, one transaction)

You need:
1. A wallet with CLAWD and ETH for gas (Base mainnet)
2. \`N * 1000 CLAWD\` where N = number of API credits you want
3. Generate N (nullifier, secret, commitment) tuples using Barretenberg Poseidon2

### 2a — Generate commitments (JavaScript/Node.js)

\`\`\`js
import { Barretenberg, Fr } from "@aztec/bb.js"; // version 0.72.1

const bb = await Barretenberg.new({ threads: 1 });
const FIELD_MODULUS = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const frToBI = (fr) => BigInt("0x" + Array.from(fr.value).map(b => b.toString(16).padStart(2,"0")).join(""));

const credits = [];
for (let i = 0; i < N; i++) {
  const rb1 = crypto.getRandomValues(new Uint8Array(32));
  const rb2 = crypto.getRandomValues(new Uint8Array(32));
  const nullifier = BigInt("0x" + Array.from(rb1).map(b=>b.toString(16).padStart(2,"0")).join("")) % FIELD_MODULUS;
  const secret   = BigInt("0x" + Array.from(rb2).map(b=>b.toString(16).padStart(2,"0")).join("")) % FIELD_MODULUS;
  const commitment = frToBI(await bb.poseidon2Hash([new Fr(nullifier), new Fr(secret)]));
  credits.push({ nullifier, secret, commitment });
}
await bb.destroy();
// Save credits — you CANNOT recover them later
\`\`\`

### 2b — Approve CLAWD spend

\`\`\`js
import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { base } from "viem/chains";

const CONTRACT = "0x4A6782D251e12c06e1f16450D8b28f6C857cFdd1";
const CLAWD    = "0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07";
const amount   = parseEther(String(N * 1000)); // N credits

const ERC20_ABI = [{ name:"approve", type:"function", inputs:[{name:"spender",type:"address"},{name:"amount",type:"uint256"}], outputs:[{name:"",type:"bool"}], stateMutability:"nonpayable" }];

await walletClient.writeContract({ address: CLAWD, abi: ERC20_ABI, functionName: "approve", args: [CONTRACT, amount] });
\`\`\`

### 2c — Call stakeAndRegister (one tx, gets you N credits)

\`\`\`js
const ABI = [{
  name: "stakeAndRegister",
  type: "function",
  inputs: [
    { name: "amount",      type: "uint256"   },
    { name: "commitments", type: "uint256[]" }
  ],
  outputs: [],
  stateMutability: "nonpayable"
}];

await walletClient.writeContract({
  address: CONTRACT,
  abi: ABI,
  functionName: "stakeAndRegister",
  args: [amount, credits.map(c => c.commitment)]
});
// After this tx confirms, your credits are live. Keep nullifier+secret+commitment for each.
\`\`\`

---

## Step 3 — Use the API

Each credit is a one-time key. The API key format is:

\`\`\`
zklm_<nullifier>_<secret>_<commitment>
\`\`\`

### Make an LLM call

\`\`\`js
const { nullifier, secret, commitment } = credits[0]; // use first available credit

const response = await fetch("https://backend.zkllmapi.com/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    nullifier: nullifier.toString(),
    secret:    secret.toString(),
    commitment: commitment.toString(),
    message:   "What is the capital of France?",
    model:     "llama-3.3-70b",  // see supported models below
    // history: []               // optional: array of {role, content} for multi-turn
  })
});

const data = await response.json();
console.log(data.response); // LLM reply
// data.nullifierHash — the spent nullifier hash (for your records)
\`\`\`

### Supported models
- \`llama-3.3-70b\` (default)
- \`deepseek-r1-671b\`
- \`mistral-31-24b\`
- \`llama-3.1-405b\`

### Error responses
- \`400 Nullifier already spent\` — credit already used, pick next one
- \`400 Commitment not found in tree\` — commitment not registered on-chain yet
- \`400 Invalid proof\` — nullifier/secret/commitment mismatch
- \`500\` — server error, retry

---

## Step 4 — Check nullifier status (optional)

Before spending a credit, you can verify it hasn't been used:

\`\`\`js
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

// Option A: check via API (fast)
const hash = await computeNullifierHash(nullifier); // see circuit details in /about
const res = await fetch(\`https://backend.zkllmapi.com/nullifier/\${hash}\`);
const { spent } = await res.json();

// Option B: check merkle path exists
const res2 = await fetch(\`https://backend.zkllmapi.com/merkle-path/\${commitment}\`);
// 200 = registered, 404 = not found
\`\`\`

---

## API Key Format (for scripting)

Store and parse your API key as a single string:

\`\`\`bash
API_KEY="zklm_<nullifier>_<secret>_<commitment>"

# Parse in bash
IFS='_' read -r _ NULLIFIER SECRET COMMITMENT <<< "$API_KEY"

# Call the API
curl -X POST https://backend.zkllmapi.com/chat \\
  -H 'Content-Type: application/json' \\
  -d "{\\"nullifier\\":\\"$NULLIFIER\\",\\"secret\\":\\"$SECRET\\",\\"commitment\\":\\"$COMMITMENT\\",\\"message\\":\\"Hello\\"}"
\`\`\`

---

## Contract Reference

**APICredits.sol** — Base mainnet \`0x4A6782D251e12c06e1f16450D8b28f6C857cFdd1\`

\`\`\`
stakeAndRegister(uint256 amount, uint256[] commitments)  // stake CLAWD + register N credits
register(uint256 commitment)                              // register one credit (must have staked)
stake(uint256 amount)                                     // stake CLAWD only
unstake(uint256 amount)                                   // withdraw unused stake
PRICE_PER_CREDIT()                                        // returns 1000e18
getTreeData()                                             // (size, depth, root)
\`\`\`

Full source: https://basescan.org/address/0x4A6782D251e12c06e1f16450D8b28f6C857cFdd1#code
GitHub: https://github.com/clawdbotatg/zk-api-credits

---

## Technical Details

See **/about** for full ZK circuit breakdown, Poseidon2 hashing, Merkle tree construction, and proof format.
`;

export async function GET() {
  return new NextResponse(SKILL_MD, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
