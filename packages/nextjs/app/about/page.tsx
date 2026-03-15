import Link from "next/link";
import type { NextPage } from "next";

const About: NextPage = () => {
  return (
    <div className="flex items-center flex-col flex-grow pt-10 pb-16">
      <div className="px-5 max-w-3xl w-full">

        {/* ── Section 1: ELI5 ── */}
        <div className="card bg-base-100 shadow-xl mb-10">
          <div className="card-body">
            <div className="badge badge-lg badge-primary mb-2">ELI5 🧒</div>
            <h2 className="card-title text-3xl mb-4">Wait, what is this?</h2>
            <p className="text-lg leading-relaxed opacity-90">
              Imagine you have a library card. You pay for it with your name and address. But when you go to the
              library to check out books, you show a magic card that proves you paid — without showing your name.
              The librarian knows <em>someone</em> paid, but not <em>you</em>. So they give you the book. Nobody
              knows what books you checked out or who you are.
            </p>
            <p className="text-lg leading-relaxed opacity-90 mt-4">
              That&apos;s this. You pay with crypto, get a magic card, use the magic card to talk to an AI. Nobody
              can connect you to what you asked.
            </p>
          </div>
        </div>

        <div className="divider text-base-content/30">↓</div>

        {/* ── Section 2: ELI18 ── */}
        <div className="card bg-base-200 shadow-xl mb-10 mt-6">
          <div className="card-body">
            <div className="badge badge-lg badge-secondary mb-2">ELI18 🧑</div>
            <h2 className="card-title text-3xl mb-4">Okay but how does it actually work?</h2>
            <p className="text-lg leading-relaxed opacity-90">
              You stake CLAWD tokens onchain — that&apos;s public, your wallet is visible. But before you do, your
              browser secretly generates two random numbers: a <strong>nullifier</strong> and a{" "}
              <strong>secret</strong>. It hashes them together into a <strong>commitment</strong> and sends only
              that to the blockchain. Your wallet never touches the nullifier or secret — they stay in your browser.
            </p>
            <p className="text-lg leading-relaxed opacity-90 mt-4">
              Later, when you want to use the AI, your browser generates a{" "}
              <strong>zero-knowledge proof</strong> — a cryptographic receipt that says:{" "}
              <em>
                &ldquo;I know the secret behind one of the commitments in this tree, and I haven&apos;t spent it
                before.&rdquo;
              </em>{" "}
              You send that proof to the server with no wallet address, no login, nothing.
            </p>
            <p className="text-lg leading-relaxed opacity-90 mt-4">
              The server checks the math, marks the nullifier as burned so you can&apos;t reuse it, and forwards
              your message to the AI.
            </p>
            <p className="text-lg leading-relaxed opacity-90 mt-4">
              The key insight: the commitment onchain and the nullifier you burn at call time are{" "}
              <strong>mathematically unlinkable</strong> without knowing the secret — which never left your browser.
            </p>
          </div>
        </div>

        <div className="divider text-base-content/30">↓</div>

        {/* ── Section 3: ELI Cryptographer ── */}
        <div className="card bg-base-300 shadow-xl mb-10 mt-6">
          <div className="card-body">
            <div className="badge badge-lg badge-accent mb-2">ELI Cryptographer 🔐</div>
            <h2 className="card-title text-3xl mb-4">Give me the full technical picture</h2>

            <p className="text-lg leading-relaxed opacity-90">
              The scheme is a Merkle-tree-based nullifier system using Poseidon2 as the hash function and UltraHonk
              (Barretenberg) as the proof system.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-2">Commitment scheme</h3>
            <pre className="bg-neutral text-neutral-content rounded-xl p-4 overflow-x-auto text-sm leading-relaxed">
              <code>{`nullifier, secret  ← rand
commitment = Poseidon2(nullifier, secret)   // onchain leaf
nullifier_hash = Poseidon2(nullifier)       // burned at spend time`}</code>
            </pre>
            <p className="text-lg leading-relaxed opacity-90 mt-4">
              Commitments are inserted into an incremental binary Merkle tree (Semaphore-style, zero-padded) stored
              onchain. The tree root is a public accumulator of all registered commitments.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-2">The Noir circuit proves three things</h3>
            <ol className="list-decimal list-inside text-lg leading-relaxed opacity-90 space-y-2">
              <li>
                <code className="bg-neutral text-neutral-content px-2 py-0.5 rounded text-sm">
                  commitment = Poseidon2(nullifier, secret)
                </code>{" "}
                — you know the preimage
              </li>
              <li>
                <code className="bg-neutral text-neutral-content px-2 py-0.5 rounded text-sm">
                  binary_merkle_root(commitment, depth, index, siblings) == root
                </code>{" "}
                — commitment is in the tree
              </li>
              <li>
                <code className="bg-neutral text-neutral-content px-2 py-0.5 rounded text-sm">
                  nullifier_hash = Poseidon2(nullifier)
                </code>{" "}
                — nullifier_hash is correctly derived
              </li>
            </ol>

            <p className="text-lg leading-relaxed opacity-90 mt-4">
              <strong>Public inputs:</strong>{" "}
              <code className="bg-neutral text-neutral-content px-2 py-0.5 rounded text-sm">nullifier_hash</code>,{" "}
              <code className="bg-neutral text-neutral-content px-2 py-0.5 rounded text-sm">root</code>,{" "}
              <code className="bg-neutral text-neutral-content px-2 py-0.5 rounded text-sm">depth</code>.{" "}
              <strong>Private inputs:</strong>{" "}
              <code className="bg-neutral text-neutral-content px-2 py-0.5 rounded text-sm">nullifier</code>,{" "}
              <code className="bg-neutral text-neutral-content px-2 py-0.5 rounded text-sm">secret</code>,{" "}
              <code className="bg-neutral text-neutral-content px-2 py-0.5 rounded text-sm">index</code>,{" "}
              <code className="bg-neutral text-neutral-content px-2 py-0.5 rounded text-sm">siblings</code>.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-2">Soundness</h3>
            <p className="text-lg leading-relaxed opacity-90">
              Breaking the scheme requires either finding a Poseidon2 collision or breaking the UltraHonk argument
              system (knowledge soundness under discrete log).
            </p>

            <h3 className="text-xl font-bold mt-6 mb-2">Unlinkability</h3>
            <p className="text-lg leading-relaxed opacity-90">
              <code className="bg-neutral text-neutral-content px-2 py-0.5 rounded text-sm">commitment</code> and{" "}
              <code className="bg-neutral text-neutral-content px-2 py-0.5 rounded text-sm">nullifier_hash</code>{" "}
              are independently derived from{" "}
              <code className="bg-neutral text-neutral-content px-2 py-0.5 rounded text-sm">nullifier</code> — you
              cannot compute one from the other without{" "}
              <code className="bg-neutral text-neutral-content px-2 py-0.5 rounded text-sm">secret</code>. The
              server sees only{" "}
              <code className="bg-neutral text-neutral-content px-2 py-0.5 rounded text-sm">nullifier_hash</code>;
              the chain sees only{" "}
              <code className="bg-neutral text-neutral-content px-2 py-0.5 rounded text-sm">commitment</code>. No
              PPT adversary can link them without{" "}
              <code className="bg-neutral text-neutral-content px-2 py-0.5 rounded text-sm">secret</code>.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-2">Anonymity set</h3>
            <p className="text-lg leading-relaxed opacity-90">
              The root used in the proof determines the anonymity set — all wallets whose commitments existed in the
              tree at that root. The server accepts any historical root, so users can generate proofs against
              larger/newer roots for better privacy.
            </p>

            <h3 className="text-xl font-bold mt-6 mb-2">Current trust assumptions</h3>
            <p className="text-lg leading-relaxed opacity-90">
              Server is trusted not to log IP↔nullifier_hash mappings. Nullifier double-spend enforcement is
              off-chain (server DB). Onchain nullifier burning would remove the server trust assumption but costs gas
              per call.
            </p>
          </div>
        </div>

        {/* ── Back to Home ── */}
        <div className="text-center mt-8">
          <Link href="/" className="btn btn-outline btn-primary">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;
