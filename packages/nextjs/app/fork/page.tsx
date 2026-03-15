import type { NextPage } from "next";

const ForkPage: NextPage = () => {
  return (
    <div className="flex items-center flex-col flex-grow pt-10 pb-20">
      <div className="px-5 max-w-3xl w-full">

        {/* Hero */}
        <div className="mb-12">
          <p className="font-mono text-xs tracking-widest uppercase opacity-50 mb-2">open infrastructure</p>
          <h1 className="text-4xl font-bold tracking-tight">Fork This</h1>
          <p className="text-lg opacity-70 mt-3 max-w-xl">
            The ZK credit system is designed to be forked. The core is token-agnostic.
            CLAWD is just our implementation on top. Deploy your own in minutes.
          </p>
        </div>

        {/* Architecture */}
        <div className="mb-12">
          <h2 className="font-mono text-xs tracking-widest uppercase opacity-50 mb-4">three-layer architecture</h2>

          <div className="space-y-4">
            {/* Layer 1 */}
            <div className="border border-base-content/20 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs bg-accent text-accent-content px-2 py-0.5 rounded shrink-0 mt-0.5">
                  L1
                </span>
                <div>
                  <h3 className="text-lg font-bold">
                    APICredits.sol
                    <span className="text-xs font-normal opacity-50 ml-2">— the forkable primitive</span>
                  </h3>
                  <p className="text-sm opacity-70 mt-1">
                    ZK Merkle tree + ERC-20 staking. No opinion on token, price, or payment method.
                    Accepts any ERC-20 set at deploy time. Static <code className="bg-base-300 px-1 rounded text-xs">pricePerCredit</code> via
                    constructor. This is what you deploy.
                  </p>
                  <div className="mt-3 font-mono text-xs opacity-60 space-y-0.5">
                    <p>├─ stake() / unstake()</p>
                    <p>├─ register() / stakeAndRegister()</p>
                    <p>├─ claimServer()</p>
                    <p>└─ Poseidon2 Merkle tree (Semaphore-style, 16 levels, 65k leaves)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Layer 2 */}
            <div className="border border-base-content/10 rounded-lg p-5 opacity-80">
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs bg-secondary text-secondary-content px-2 py-0.5 rounded shrink-0 mt-0.5">
                  L2
                </span>
                <div>
                  <h3 className="text-lg font-bold">
                    CLAWDPricing.sol
                    <span className="text-xs font-normal opacity-50 ml-2">— our TWAP oracle</span>
                  </h3>
                  <p className="text-sm opacity-70 mt-1">
                    30-minute Uniswap v3 TWAP on the WETH/CLAWD pool + Chainlink ETH/USD with owner-set
                    fallback. Returns USD-pegged pricing in CLAWD terms. Swap this out for your own pricing.
                  </p>
                  <div className="mt-3 font-mono text-xs opacity-60 space-y-0.5">
                    <p>├─ getCreditPriceInCLAWD()</p>
                    <p>├─ getClawdPerEth() — TWAP</p>
                    <p>├─ getEthUsdPrice() — Chainlink + fallback</p>
                    <p>└─ setCreditPriceUSD() — owner adjustable</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Layer 3 */}
            <div className="border border-base-content/10 rounded-lg p-5 opacity-80">
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs bg-secondary text-secondary-content px-2 py-0.5 rounded shrink-0 mt-0.5">
                  L3
                </span>
                <div>
                  <h3 className="text-lg font-bold">
                    CLAWDRouter.sol
                    <span className="text-xs font-normal opacity-50 ml-2">— our payment router</span>
                  </h3>
                  <p className="text-sm opacity-70 mt-1">
                    Accepts ETH, USDC, or CLAWD directly. Swaps non-CLAWD payments to CLAWD via Uniswap v3,
                    then calls APICredits.stakeAndRegister(). Replace with your own router for your own
                    token and payment flow.
                  </p>
                  <div className="mt-3 font-mono text-xs opacity-60 space-y-0.5">
                    <p>├─ buyWithCLAWD()</p>
                    <p>├─ buyWithETH() — swaps via Uniswap</p>
                    <p>└─ buyWithUSDC() — swaps USDC → WETH → CLAWD</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-base-content/10 my-10" />

        {/* How to Fork */}
        <div className="mb-12">
          <h2 className="font-mono text-xs tracking-widest uppercase opacity-50 mb-4">deploy your own</h2>

          <div className="bg-base-300 rounded-lg p-6">
            <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
{`# 1. Clone
git clone https://github.com/clawdbotatg/zk-api-credits
cd zk-api-credits

# 2. Install
yarn install

# 3. Deploy APICredits with YOUR token
#    Edit packages/hardhat/deploy/00_deploy_api_credits.ts
#    Set your ERC-20 address + price per credit
yarn deploy --network base

# 4. Point the API server at your contract
#    Edit packages/api-server/.env
CONTRACT_ADDRESS=0xYourNewContract

# 5. Start serving
cd packages/api-server && yarn start`}
            </pre>
          </div>

          <p className="text-sm opacity-50 mt-3">
            That&apos;s it. You don&apos;t need CLAWDPricing or CLAWDRouter unless you want
            USD-pegged dynamic pricing or multi-asset payments. APICredits works standalone
            with a fixed price in your token.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-base-content/10 my-10" />

        {/* What stays / what changes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Stays the same */}
          <div>
            <h2 className="font-mono text-xs tracking-widest uppercase opacity-50 mb-4">
              unchanged when you fork
            </h2>
            <ul className="space-y-3">
              {[
                ["ZK Circuit", "Noir + UltraHonk. Commitment, Merkle proof, nullifier derivation."],
                ["Privacy Model", "Poseidon2 commitments, unlinkable nullifiers, anonymity set = tree size."],
                ["API Server", "Proof verification, nullifier tracking, historical root cache."],
                ["Merkle Tree", "Semaphore-style incremental tree, 16 levels, Poseidon2 hashing."],
              ].map(([title, desc]) => (
                <li key={title} className="flex items-start gap-2">
                  <span className="text-success mt-0.5">■</span>
                  <div>
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-xs opacity-60">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Yours to customize */}
          <div>
            <h2 className="font-mono text-xs tracking-widest uppercase opacity-50 mb-4">
              yours to customize
            </h2>
            <ul className="space-y-3">
              {[
                ["Payment Token", "Any ERC-20. Set at deploy time."],
                ["Pricing", "Fixed, TWAP, auction, governance vote — anything."],
                ["Payment Methods", "ETH, USDC, x402, credit card, whatever you build."],
                ["Inference Provider", "Venice, OpenAI, Anthropic, local model — swap the API URL."],
                ["Credit Tiers", "Different prices for different models or usage levels."],
              ].map(([title, desc]) => (
                <li key={title} className="flex items-start gap-2">
                  <span className="text-warning mt-0.5">◆</span>
                  <div>
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-xs opacity-60">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-base-content/10 my-10" />

        {/* Architecture diagram (ASCII) */}
        <div className="mb-12">
          <h2 className="font-mono text-xs tracking-widest uppercase opacity-50 mb-4">data flow</h2>
          <div className="bg-base-300 rounded-lg p-6 overflow-x-auto">
            <pre className="font-mono text-xs leading-relaxed">
{`┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser   │     │  APICredits  │     │  API Server  │
│             │     │   (onchain)  │     │  (offchain)  │
└──────┬──────┘     └──────┬───────┘     └──────┬───────┘
       │                   │                    │
       │  1. stake(CLAWD)  │                    │
       │──────────────────>│                    │
       │                   │                    │
       │  2. register(     │                    │
       │     commitment)   │                    │
       │──────────────────>│                    │
       │                   │                    │
       │                   │  commitment        │
       │                   │  inserted into     │
       │                   │  Merkle tree       │
       │                   │                    │
       │  3. generate ZK proof (client-side)    │
       │  prove: I know secret behind a leaf    │
       │                                        │
       │  4. POST /v1/chat {proof, nullifier}   │
       │───────────────────────────────────────>│
       │                                        │
       │                        5. verify proof │
       │                        6. check root   │
       │                        7. burn nullif  │
       │                        8. call LLM     │
       │                                        │
       │  9. LLM response                       │
       │<───────────────────────────────────────│
       │                                        │`}
            </pre>
          </div>
          <p className="text-xs opacity-40 mt-2 font-mono">
            Steps 1-2 require a wallet. Steps 3-9 are anonymous — no wallet, no identity.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a
            href="https://github.com/clawdbotatg/zk-api-credits"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-accent btn-lg"
          >
            View on GitHub →
          </a>
          <p className="text-xs opacity-40 mt-3 font-mono">MIT licensed. Fork it. Ship it. Don&apos;t ask permission.</p>
        </div>
      </div>
    </div>
  );
};

export default ForkPage;
