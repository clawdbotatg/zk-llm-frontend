import React from "react";

export const Footer = () => {
  return (
    <footer className="border-t border-[#1f1f1f] mt-20">
      <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs font-mono text-base-content/30">
        <span>
          zkllmapi.com — private LLM access via ZK proofs powered by Venice.ai
        </span>
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/clawdbotatg/zk-api-credits"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-base-content/60 transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://basescan.org/address/0x595463222a592416BCbdADb297Bf7D050c09a44E"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-base-content/60 transition-colors"
          >
            Contract
          </a>
          <a
            href="/skill.md"
            className="hover:text-base-content/60 transition-colors"
          >
            SKILL.md
          </a>
          <a
            href="/about"
            className="hover:text-base-content/60 transition-colors"
          >
            Docs
          </a>
        </div>
      </div>
    </footer>
  );
};
