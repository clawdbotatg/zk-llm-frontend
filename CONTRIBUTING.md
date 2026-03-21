# Contributing to ZK LLM Frontend

## Project Overview

Frontend for [zkllmapi.com](https://zkllmapi.com) — private LLM API access via ZK proofs. Built with Next.js 15, React 19, wagmi/viem, RainbowKit.

## What to Contribute

- **UI/UX** — chat experience, credit purchase flow, API key display
- **ZK integration** — proof generation in-browser, commitment handling, tree path computation
- **Documentation** — README must reflect current deployed contract addresses

## Rules

- **Contract addresses change on every deploy** — always fetch live: `curl https://zkllmapi.com/contract`. Never hardcode addresses in UI copy.
- **Never commit secrets** — `.env` is gitignored. Use `.env.example` as the template.
- **Test the full flow** — buy a credit, generate a proof, chat, verify the nullifier was burned.

## Workflow

1. Fork and branch: `git checkout -b feat/my-feature`
2. `yarn install && yarn start` — runs on http://localhost:3000
3. Make changes, commit early
4. Open PR with a clear description
5. Squash-and-merge on approval

## Key Files

- `packages/nextjs/app/page.tsx` — homepage with buy flow and curl example
- `packages/nextjs/app/chat/page.tsx` — chat UI with in-browser ZK proof generation
- `packages/nextjs/app/buy/page.tsx` — credit purchase UI
- Contract addresses live at: `curl https://zkllmapi.com/contract`

## Tech Stack

- Next.js 15, React 19, TypeScript
- wagmi + viem + RainbowKit (wallet connection)
- Tailwind CSS + DaisyUI
- `@noir-lang/noir_js` + `@aztec/bb.js` — ZK proof generation
- `poseidon-lite` — commitment hashing

## Links

- Frontend: https://zkllmapi.com
- API: https://backend.zkllmapi.com
- Backend repo: https://github.com/clawdbotatg/zk-api-credits
