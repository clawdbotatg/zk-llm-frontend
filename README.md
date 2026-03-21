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
| APICredits | `0xE7cc1F41Eb59775bD201Bb943d2230BA52294608` |
| CLAWDRouter | `0x9302e14c54fbA35A96457f6dD7A3AF5c082D5C24` |
| CLAWDPricing | `0xaca9733Cc19aD837899dc7D1170aF1d5367C332E` |
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
