import { NextResponse } from "next/server";

const SKILL_MD = `# ZK LLM API — zkllmapi.com

Private, anonymous LLM access via zero-knowledge proofs on Base.
No account. No API key. No identity. Pay once in CLAWD, use privately.

## API Endpoint

POST https://backend.zkllmapi.com/v1/chat

## Request Format

\`\`\`json
{
  "proof": "<hex string — UltraHonk ZK proof>",
  "nullifier_hash": "0x...",
  "root": "0x...",
  "depth": 16,
  "messages": [
    { "role": "user", "content": "your message here" }
  ]
}
\`\`\`

## Model

hermes-3-llama-3.1-405b — 405B open-weight, private Venice inference.
Model is fixed: one credit = one call to this model.

## How to Get a Credit

1. Go to https://zkllmapi.com/buy
2. Connect a wallet on Base
3. Approve CLAWD token spend
4. Register a ZK commitment onchain
5. Download your secret (stored locally — never leaves your browser)

## How to Generate a Proof (client-side)

1. Fetch the Noir circuit: GET https://backend.zkllmapi.com/circuit
2. Fetch the current Merkle tree: GET https://backend.zkllmapi.com/tree
3. Use @aztec/bb.js (UltraHonk) to generate a proof locally
4. POST proof + messages to /v1/chat

The proof proves you own a registered commitment without revealing which one.
The nullifier is burned on use — each credit is single-use.

## Useful Endpoints

- GET https://zkllmapi.com/contract — current APICredits address on Base
- GET https://backend.zkllmapi.com/health — server status + tree size
- GET https://backend.zkllmapi.com/circuit — Noir circuit JSON for proof generation
- GET https://backend.zkllmapi.com/tree — current Merkle tree state

## Contracts (Base mainnet, chain 8453)

- APICredits: 0x595463222a592416BCbdADb297Bf7D050c09a44E
- CLAWDPricing: 0x445DbaFC831940c252CAE3f04e35F9045616Ce19
- CLAWDRouter: 0xCB42c19bB4021C30960c45212E8A9162259ea3E5
- CLAWD token: 0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07 (permanent)

## Privacy Model

- Your wallet is only used to buy credits + register (one-time, onchain)
- Every chat request is unlinkable — no wallet, no session, no IP logging at the app layer
- Proof generation happens in your browser — secrets never sent to the server
- The server only sees: a valid proof, a nullifier, and your message

## Fork This

This system is designed to be forked. APICredits.sol is token-agnostic.
See https://zkllmapi.com/fork for the 3-layer architecture and deploy instructions.
MIT licensed. No permission needed.

## Source

https://github.com/clawdbotatg/zk-api-credits
`;

export async function GET() {
  return new NextResponse(SKILL_MD, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
