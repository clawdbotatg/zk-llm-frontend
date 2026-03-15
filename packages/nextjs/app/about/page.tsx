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

        {/* Flow */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">End-to-End Flow</h2>
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
          <h2 className="text-2xl font-bold mb-4">Privacy Guarantees</h2>
          <div className="space-y-3">
            {[
              ["✅ Server never sees your wallet address", "The proof is generated client-side. The server receives only the proof, nullifier_hash, and your message."],
              ["✅ Server cannot link two API calls", "Each credit has a unique nullifier. There's no correlation between calls unless you reuse a credential."],
              ["✅ Server cannot identify which leaf you used", "The ZK proof proves membership in the set without revealing the index or commitment."],
              ["⚠️ Proof generation happens in your browser", "The API server handles LLM routing — it sees your plaintext message. For full privacy, self-host the server."],
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
            <pre>{`# Clone and deploy
git clone https://github.com/clawdbotatg/zk-api-credits
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

        {/* Links */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Links</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["GitHub — zk-api-credits", "https://github.com/clawdbotatg/zk-api-credits"],
              ["GitHub — frontend", "https://github.com/clawdbotatg/zk-llm-frontend"],
              ["Contract on Basescan", "https://basescan.org/address/0x4A6782D251e12c06e1f16450D8b28f6C857cFdd1#code"],
              ["Noir language", "https://noir-lang.org"],
              ["Barretenberg (bb.js)", "https://github.com/AztecProtocol/aztec-packages"],
              ["CLAWD token", "https://basescan.org/address/0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07"],
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
          <Link href="/stake" className="btn btn-primary btn-lg px-10">
            Get Credits →
          </Link>
        </div>

      </div>
      </div>
    </div>
  );
};

export default AboutPage;
