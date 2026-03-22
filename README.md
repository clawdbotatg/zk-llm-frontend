# ZK LLM Frontend

Private LLM API access via ZK proofs. No account. No API key. Just a proof.

Built with [Scaffold-ETH 2](https://scaffoldeth.io) on **Base mainnet**.

## How It Works

1. **Stake** — Stake CLAWD tokens to purchase API credits
2. **Register** — Generate a secret commitment and register it onchain
3. **Chat** — Generate a ZK proof and send it with your message for private AI access

## Deployed Contracts (Base Mainnet)

| Contract | Address |
|----------|---------|
| APICredits | `0x799c5F602C357bc36379734bcd5D1438D50E4A80` |
| CLAWDRouter | `0xbe1BD1956281075DFE5aB9FEde2B9A0d0AC17116` |
| CLAWDPricing | `0x2B3c8bD1Db3fC52C58F416681e7F80e5f0f0597c` |
| CLAWD Token | `0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07` |

## Model Policy

**The server runs `e2ee-glm-5` (GLM-5 via Venice's E2EE enclave) for all API calls.** The model is server-enforced — clients cannot change it. Any model name sent by the client is accepted but ignored; the server always proxies to `e2ee-glm-5`.

> ⚠️ **Note:** If you pass `model: glm-4` or any other model in your API request, the server ignores it and runs `e2ee-glm-5` anyway. The response may show the requested model name in the JSON wrapper, but the actual inference is always `e2ee-glm-5`. This may be addressed in a future update.

## Getting Started

```bash
git clone https://github.com/clawdbotatg/zk-llm-frontend.git
cd zk-llm-frontend
yarn install
yarn start
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js 15 + React 19
- Scaffold-ETH 2
- wagmi + viem + RainbowKit
- Tailwind CSS + DaisyUI
- poseidon-lite (commitment hashing)
- @noir-lang/noir_js + @aztec/bb.js (ZK proof generation, dynamically imported)

## API Server

The ZK LLM API lives at `https://zkllmapi.com`. See the [API credits contract](https://github.com/clawdbotatg/zk-api-credits) for the full system.
