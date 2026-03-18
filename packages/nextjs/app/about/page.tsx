import type { NextPage } from "next";
import Link from "next/link";

const AboutPage: NextPage = () => {
  return (
    <div className="relative min-h-[calc(100vh-56px)]" style={{backgroundImage: "url(/hero-about.jpg)", backgroundSize: "cover", backgroundPosition: "center"}}>
      <div className="absolute inset-0 bg-black/85" />
      <div className="relative z-10 flex items-center flex-col grow pt-10 pb-20">
      <div className="px-5 max-w-2xl w-full prose prose-sm max-w-none">

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">How ZK LLM API Works</h1>
          <p className="text-base-content/60">
            Full technical breakdown — from token stake to ZK proof to LLM response.
          </p>
        </div>

        {/* Overview */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Overview</h2>
          <p className="text-base-content/70 leading-relaxed">
            ZK LLM API lets anyone access a private LLM endpoint by paying with CLAWD token.
            The server never knows who you are — it only verifies a zero-knowledge proof that
            you hold a valid, unspent credit in an onchain Merkle tree.
          </p>
          <p className="text-base-content/70 leading-relaxed mt-3">
            The system is fully open-source and self-hostable. Anyone can fork it, deploy their
            own contract, point it at any LLM provider, and run the same privacy-preserving
            access control.
          </p>
        </section>

        {/* This Is Step One */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">📍 This Is Step One</h2>
          <p className="text-base-content/70 leading-relaxed mb-4">
            This project is a <strong>baby step prototype</strong> — the first working implementation
            of the ideas described in{" "}
            <a
              href="https://ethresear.ch/t/zk-api-usage-credits-llms-and-beyond/24104"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#42F38F] transition-colors"
            >
              &ldquo;ZK API Usage Credits: LLMs and Beyond&rdquo;
            </a>{" "}
            by <strong>Vitalik Buterin</strong> and <strong>Davide Crapis</strong>. We shipped
            something real that proves the concept works. But the paper describes a much deeper
            system, and we haven&apos;t implemented most of it yet.
          </p>

          <div className="bg-base-100 rounded-xl p-5 shadow mb-4">
            <p className="font-bold text-sm mb-3">What we built:</p>
            <ul className="space-y-3 text-sm">
              {[
                "Simple single-use nullifiers — 1 credit = 1 API call, burn and done",
                "ZK Merkle membership proof — proves \"I know a commitment in the tree\"",
                "Fixed cost per credit — stake once, each credit is one call",
                "Single provider integration (Venice AI) with E2EE support",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded border-2 border-success bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-base-content/60">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-base-100 rounded-xl p-5 shadow mb-4">
            <p className="font-bold text-sm mb-3">What the paper proposes that we haven&apos;t built:</p>
            <ul className="space-y-3 text-sm">
              {[
                ["Rate-Limit Nullifiers (RLN)", "Users make many anonymous calls per single deposit. Double-spending a ticket index mathematically reveals your secret key, enabling slashing. We use simple one-time nullifiers instead."],
                ["Variable cost & refund tickets", "User sets a max cost per call; server issues signed refund tickets for unused capacity. We use fixed 1-credit-per-call pricing with no refunds."],
                ["ZK solvency proof", "The circuit should prove (ticket_index + 1) × C_max ≤ deposit + Σ(refunds), verifying server signatures on refund tickets as private inputs. Our circuit only proves Merkle membership."],
                ["RLN slashing", "Mathematical double-spend detection that reveals the cheater's secret key so anyone can slash their deposit. We just check a database."],
                ["Dual staking (Policy Stake)", "A separate stake the server can burn but not claim, preventing servers from profiting off false bans. Not implemented."],
                ["Homomorphic refund accumulation", "Pedersen Commitments let the server update your balance without learning the total. Constant-size client state. Not implemented."],
                ["Parallelizable requests", "Generate tickets i, i+1, i+2 simultaneously. We process one credit at a time."],
                ["Generalized API support", "The paper applies to any fixed-cost API: RPC nodes, image generation, cloud compute, VPNs. We only support LLM inference via Venice."],
              ].map(([title, desc]) => (
                <li key={title} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded border-2 border-base-content/20 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-base-content/80">{title}</strong>
                    <span className="text-base-content/50"> — {desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-base-100 rounded-xl p-5 shadow">
            <p className="text-base-content/60 text-sm leading-relaxed">
              <strong className="text-base-content">This is open source.</strong> Every item above
              is something someone could build next. If you want to help implement the full vision
              from the paper, check the{" "}
              <a
                href="https://github.com/clawdbotatg/zk-api-credits"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#42F38F] transition-colors"
              >
                backend repo
              </a>{" "}
              and{" "}
              <a
                href="https://github.com/clawdbotatg/zk-llm-frontend"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#42F38F] transition-colors"
              >
                frontend repo
              </a>
              . We shipped step one. The roadmap is the paper.
            </p>
          </div>
        </section>

        {/* Privacy Stack */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">🔐 The Privacy Stack</h2>
          <p className="text-base-content/70 leading-relaxed mb-4">
            ZK LLM API now combines <strong>two independent, orthogonal privacy layers</strong> — our
            zero-knowledge proofs plus Venice&apos;s new{" "}
            <a
              href="https://venice.ai/blog/venice-launches-end-to-end-encrypted-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#42F38F] transition-colors"
            >
              end-to-end encrypted AI inference
            </a>
            . Together they form a killer combination: <strong>nobody knows both WHO you are AND WHAT
            you&apos;re asking</strong>.
          </p>

          <div className="space-y-3 mb-4">
            <div className="bg-base-100 rounded-xl p-5 shadow">
              <div className="flex items-start gap-3">
                <span className="text-xl">🛡️</span>
                <div>
                  <h3 className="font-bold mb-1">Layer 1: ZK Proofs — Hides <em>WHO</em></h3>
                  <p className="text-base-content/60 text-sm leading-relaxed">
                    Our zero-knowledge proof breaks the link between your wallet and your API call.
                    The server verifies a proof of valid credit — it never learns your identity,
                    wallet address, or which onchain commitment you used.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-base-100 rounded-xl p-5 shadow">
              <div className="flex items-start gap-3">
                <span className="text-xl">🔒</span>
                <div>
                  <h3 className="font-bold mb-1">Layer 2: Venice TEE/E2EE — Hides <em>WHAT</em></h3>
                  <p className="text-base-content/60 text-sm leading-relaxed">
                    Venice now offers hardware-enclave inference (TEE) and full end-to-end encryption (E2EE).
                    Your prompt is encrypted on your device, stays encrypted through Venice&apos;s proxy,
                    and is only decrypted inside a secure hardware enclave. Venice literally cannot see
                    your prompts — verified by cryptographic remote attestation. Each response is
                    cryptographically signed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-base-100 rounded-xl p-5 shadow">
            <p className="font-bold text-sm mb-2">Combined result:</p>
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr>
                    <th>Layer</th>
                    <th>What it hides</th>
                    <th>Mechanism</th>
                  </tr>
                </thead>
                <tbody className="text-base-content/70 text-sm">
                  <tr>
                    <td className="font-medium">ZK proof (us)</td>
                    <td><strong>WHO</strong> is paying / calling</td>
                    <td>Breaks wallet ↔ API call link on-chain</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Venice TEE/E2EE</td>
                    <td><strong>WHAT</strong> you&apos;re asking</td>
                    <td>Hardware enclave + cryptographic attestation</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-base-content/50 text-sm mt-3">
              No one — not us, not Venice, not the GPU operator, not the blockchain — knows both
              who you are and what you&apos;re asking. These are orthogonal privacy guarantees that
              reinforce each other.
            </p>
          </div>
        </section>

        {/* Flow */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">End-to-End Flow (So Far)</h2>
          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Buy CLAWD",
                body: "CLAWD is an ERC-20 token on Base mainnet. Swap ETH or USDC for CLAWD on any Base DEX. Token: 0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07"
              },
              {
                step: "2",
                title: "Generate commitment locally",
                body: "Your browser generates a random nullifier and secret. It computes commitment = Poseidon2(nullifier, secret) using Barretenberg's WASM prover. The nullifier and secret never leave your device."
              },
              {
                step: "3",
                title: "stakeAndRegister() — one transaction",
                body: "You approve CLAWD, then call stakeAndRegister(amount, commitments[]) on the APICredits contract. This stakes N×1000 CLAWD and inserts your commitments into an onchain incremental Merkle tree. One transaction, N credits."
              },
              {
                step: "4",
                title: "API server reads the Merkle tree",
                body: "The API server watches the contract. When you call /chat, it fetches your commitment's Merkle path (siblings + indices) from the onchain tree and sends it back to your client."
              },
              {
                step: "5",
                title: "Client generates a ZK proof",
                body: "Your browser runs the Noir circuit via Barretenberg UltraHonk. The proof shows: (a) you know a nullifier+secret whose Poseidon2 hash is in the Merkle tree, and (b) the nullifier hash is correct. All private inputs stay on-device."
              },
              {
                step: "6",
                title: "Server verifies and responds",
                body: "The server verifies the UltraHonk proof against the onchain root, checks the nullifier hasn't been spent, marks it spent, then forwards your message to the Venice LLM API and returns the response."
              }
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-4 bg-base-100 rounded-xl p-5 shadow">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  {step}
                </div>
                <div>
                  <h3 className="font-bold mb-1">{title}</h3>
                  <p className="text-base-content/60 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ZK Circuit */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">The ZK Circuit</h2>
          <p className="text-base-content/70 mb-4">
            Written in <a href="https://noir-lang.org" target="_blank" rel="noopener noreferrer" className="text-primary">Noir</a>,
            compiled with Barretenberg (UltraHonk backend). The circuit has:
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-base-100 rounded-lg p-4 shadow">
              <p className="text-xs text-base-content/50 mb-1">Public inputs (verifier sees)</p>
              <ul className="text-sm space-y-1">
                <li><code className="text-xs">nullifier_hash</code> — Poseidon2(nullifier)</li>
                <li><code className="text-xs">root</code> — onchain Merkle root</li>
                <li><code className="text-xs">depth</code> — current tree depth</li>
              </ul>
            </div>
            <div className="bg-base-100 rounded-lg p-4 shadow">
              <p className="text-xs text-base-content/50 mb-1">Private inputs (never leave client)</p>
              <ul className="text-sm space-y-1">
                <li><code className="text-xs">nullifier</code> — random 256-bit value</li>
                <li><code className="text-xs">secret</code> — random 256-bit value</li>
                <li><code className="text-xs">indices[16]</code> — Merkle path bits</li>
                <li><code className="text-xs">siblings[16]</code> — Merkle sibling hashes</li>
              </ul>
            </div>
          </div>
          <div className="bg-base-300 rounded-xl p-4 text-xs font-mono overflow-x-auto mb-4">
            <p className="text-base-content/50 mb-2">{`// main.nr — the full circuit`}</p>
            <pre className="whitespace-pre text-base-content/80">{`use std::hash::poseidon2::Poseidon2;
use binary_merkle_root::binary_merkle_root;

fn main(
    nullifier_hash: pub Field,   // public
    root: pub Field,             // public
    depth: pub u32,              // public

    nullifier: Field,            // private
    secret: Field,               // private
    indices: [u1; 16],           // private
    siblings: [Field; 16],       // private
) {
    // 1. commitment = Poseidon2(nullifier, secret)
    let commitment = Poseidon2::hash([nullifier, secret], 2);

    // 2. commitment is in the Merkle tree
    let computed_root = binary_merkle_root(
        |pair: [Field; 2]| -> Field { Poseidon2::hash(pair, 2) },
        commitment, depth, indices, siblings,
    );
    assert(computed_root == root);

    // 3. nullifier_hash = Poseidon2(nullifier)
    let computed_nullifier_hash = Poseidon2::hash([nullifier], 1);
    assert(computed_nullifier_hash == nullifier_hash);
}`}</pre>
          </div>
          <p className="text-base-content/60 text-sm">
            The circuit proves three things simultaneously without revealing the nullifier or secret:
            the commitment was correctly formed, it exists in the registered set, and the nullifier
            hash matches — enabling the server to track spent credits without learning which credit belongs to whom.
          </p>
        </section>

        {/* Hashing */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Poseidon2 Hashing</h2>
          <p className="text-base-content/70 mb-3">
            All hashing uses <strong>Poseidon2</strong> — a ZK-friendly hash function designed for
            efficient in-circuit computation. Critically, this is <em>not</em> the same as the
            original Poseidon hash used by iden3/Circom.
          </p>
          <p className="text-base-content/70 mb-3">
            We use Barretenberg&apos;s implementation (<code className="text-xs bg-base-200 px-1 rounded">@aztec/bb.js v0.72.1</code>),
            which must match exactly between the circuit, the API server, and the frontend client.
            Using any other Poseidon implementation will produce different hashes and invalid proofs.
          </p>
          <div className="bg-base-100 rounded-xl p-4 shadow text-sm">
            <p className="font-bold mb-2">Three hash operations in the system:</p>
            <ul className="space-y-2 text-base-content/70">
              <li><code className="text-xs bg-base-200 px-1 rounded">commitment = Poseidon2(nullifier, secret)</code> — computed client-side, stored onchain</li>
              <li><code className="text-xs bg-base-200 px-1 rounded">node = Poseidon2(left, right)</code> — used at every level of the Merkle tree</li>
              <li><code className="text-xs bg-base-200 px-1 rounded">nullifier_hash = Poseidon2(nullifier)</code> — public, used to track spent credits</li>
            </ul>
          </div>
        </section>

        {/* Merkle Tree */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Incremental Merkle Tree</h2>
          <p className="text-base-content/70 mb-3">
            The onchain contract maintains a Semaphore-style incremental binary Merkle tree
            with max depth 16 (up to 65,536 leaves). Each registered commitment is a leaf.
          </p>
          <p className="text-base-content/70 mb-3">
            Empty subtrees use precomputed zero hashes: <code className="text-xs bg-base-200 px-1 rounded">zeros[0] = 0</code>,{" "}
            <code className="text-xs bg-base-200 px-1 rounded">zeros[i+1] = Poseidon2(zeros[i], zeros[i])</code>.
            Every level always hashes two children — this matches Noir&apos;s{" "}
            <code className="text-xs bg-base-200 px-1 rounded">binary_merkle_root</code> exactly.
          </p>
          <div className="bg-base-100 rounded-xl p-4 shadow text-sm text-base-content/70">
            <p className="font-bold mb-1 text-base-content">Why not LeanIMT?</p>
            <p>
              LeanIMT promotes odd nodes to the next level without hashing, which doesn&apos;t match
              Noir&apos;s standard binary Merkle root algorithm. We use the Semaphore approach instead:
              every level hashes two children, padding with the zero hash for the current level.
            </p>
          </div>
        </section>

        {/* Privacy */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Privacy Guarantees (Current)</h2>
          <div className="space-y-3">
            {[
              ["✅ Server never sees your wallet address", "The proof is generated client-side. The server receives only the proof, nullifier_hash, and your message."],
              ["✅ Server cannot link two API calls", "Each credit has a unique nullifier. There's no correlation between calls unless you reuse a credential."],
              ["✅ Server cannot identify which leaf you used", "The ZK proof proves membership in the set without revealing the index or commitment."],
              ["⚠️ Proof generation happens in your browser", "The API server handles LLM routing. When using Venice TEE/E2EE models, your prompt is encrypted end-to-end — even Venice and the GPU operator can't see it. For non-E2EE models, the server sees your plaintext message; for full privacy with those, self-host the server."],
              ["⚠️ Credits are stored in localStorage", "If you clear your browser, unspent credits are gone (CLAWD stays staked onchain, but the credentials are lost). Back them up — or better yet, script the purchase and let your bot manage credits automatically via the skill.md API."],
            ].map(([title, body]) => (
              <div key={title as string} className="bg-base-100 rounded-xl p-4 shadow">
                <p className="font-bold text-sm mb-1">{title}</p>
                <p className="text-base-content/60 text-sm">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Self-hosting */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Self-Hosting</h2>
          <p className="text-base-content/70 mb-3">
            Everything is open-source. You can deploy your own instance pointing at any LLM provider.
          </p>
          <div className="bg-base-300 rounded-xl p-4 text-xs font-mono overflow-x-auto mb-4">
            <pre>{`# Clone both repos
git clone https://github.com/clawdbotatg/zk-api-credits   # contracts + API server
git clone https://github.com/clawdbotatg/zk-llm-frontend   # frontend
cd zk-api-credits

# Configure
cp packages/api-server/.env.example packages/api-server/.env
# Set: CONTRACT_ADDRESS, VENICE_API_KEY (or any OpenAI-compatible key), RPC_URL

# Deploy contract
cd packages/hardhat
npx hardhat deploy --network base --tags APICredits

# Run API server
docker build -f packages/api-server/Dockerfile -t zk-api-server .
docker run -p 3001:3001 --env-file packages/api-server/.env zk-api-server

# Deploy frontend (Vercel)
cd packages/nextjs
NEXT_PUBLIC_API_URL=https://your-server.com vercel deploy`}</pre>
          </div>
        </section>

        {/* The Roadmap */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">🗺️ The Roadmap</h2>
          <p className="text-base-content/70 leading-relaxed mb-4">
            The build order toward the full paper vision, roughly ordered by complexity.
          </p>
          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Generalized API Support",
                difficulty: "Low",
                badge: "badge-success",
                body: "The contract is already generic. Swap the hardcoded Venice routing for a pluggable proxy layer — any OpenAI-compatible endpoint, any fixed-cost API. RPC nodes, image generation, VPNs, data APIs. Makes this a platform, not just an LLM wrapper."
              },
              {
                step: "2",
                title: "Dual Staking (Policy Stake)",
                difficulty: "Low–Medium",
                badge: "badge-success",
                body: "Split the deposit into D (RLN stake) and S (policy stake). The server can burn S but never claim it — removing any incentive to falsely ban users. Pure contract change, no circuit modifications."
              },
              {
                step: "3",
                title: "Variable Cost + Refund Tickets",
                difficulty: "Medium",
                badge: "badge-warning",
                body: "Venice returns token counts on every response. The server signs a refund ticket for unused capacity (C_max - C_actual). The client accumulates these locally. Unlocks efficient per-token pricing instead of fixed credits."
              },
              {
                step: "4",
                title: "Rate-Limit Nullifiers (RLN)",
                difficulty: "Medium–High",
                badge: "badge-warning",
                body: "Replace single-use nullifiers with RLN. Each request uses a ticket index i; the signal is y = secret + Hash(secret, i) × Hash(message). Reusing the same index with a different message reveals the secret key mathematically. Requires porting the RLN circuit to Noir and updating the contract, server, and frontend."
              },
              {
                step: "5",
                title: "RLN Slashing",
                difficulty: "Medium",
                badge: "badge-warning",
                body: "Once RLN is in place, slashing is a contract function: submit two (nullifier, x, y) pairs for the same index, recover the secret key, verify it matches a tree leaf, burn the deposit. Anyone can slash — no trusted arbiter needed."
              },
              {
                step: "6",
                title: "ZK Solvency Proof",
                difficulty: "Very High",
                badge: "badge-error",
                body: "The circuit proves (ticket_index + 1) × C_max ≤ deposit + Σ(refunds), verifying server signatures on refund tickets as private inputs. Requires a ZK-friendly signing scheme and is the most complex circuit change in the roadmap. The full paper vision lives here."
              },
              {
                step: "7",
                title: "Homomorphic Refund Accumulation",
                difficulty: "High",
                badge: "badge-error",
                body: "Replace the growing refund ticket list with a single Pedersen Commitment the server updates homomorphically — without learning the user's balance. Constant client-side state regardless of call count. An optimization on top of Step 6."
              },
            ].map(({ step, title, difficulty, badge, body }) => (
              <div key={step} className="flex gap-4 bg-base-100 rounded-xl p-5 shadow">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  {step}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{title}</h3>
                    <span className={`badge badge-sm ${badge}`}>{difficulty}</span>
                  </div>
                  <p className="text-base-content/60 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-base-content/60 text-sm mt-6 text-center italic">
            We shipped step zero.{" "}
            <a
              href="https://ethresear.ch/t/zk-api-usage-credits-llms-and-beyond/24104"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#42F38F] transition-colors"
            >
              The paper is the map.
            </a>
          </p>
        </section>

        {/* Links */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Links</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Original paper — Vitalik & Davide Crapis", "https://ethresear.ch/t/zk-api-usage-credits-llms-and-beyond/24104"],
              ["GitHub — zk-api-credits", "https://github.com/clawdbotatg/zk-api-credits"],
              ["GitHub — frontend", "https://github.com/clawdbotatg/zk-llm-frontend"],
              ["Contract on Basescan", "https://basescan.org/address/0x4A6782D251e12c06e1f16450D8b28f6C857cFdd1#code"],
              ["Noir language", "https://noir-lang.org"],
              ["Barretenberg (bb.js)", "https://github.com/AztecProtocol/aztec-packages"],
              ["CLAWD token", "https://basescan.org/address/0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07"],
              ["Venice E2EE announcement", "https://venice.ai/blog/venice-launches-end-to-end-encrypted-ai"],
            ].map(([label, url]) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-base-100 rounded-xl p-4 shadow hover:bg-base-200 transition-colors flex items-center justify-between"
              >
                <span className="text-sm font-medium">{label}</span>
                <span className="text-base-content/40">↗</span>
              </a>
            ))}
          </div>
        </section>

        <div className="text-center mt-8">
          <Link href="/buy" className="btn btn-primary btn-lg px-10">
            Get Credits →
          </Link>
        </div>

      </div>
      </div>
    </div>
  );
};

export default AboutPage;
