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
| APICredits | `0x9991f959040De3c5df0515FFCe8B38b72cB7F26c` |
| CLAWD Token | `0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07` |

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
