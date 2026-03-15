"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
};

export const menuLinks: HeaderMenuLink[] = [
  { label: "Buy", href: "/stake" },
  { label: "Chat", href: "/chat" },
  { label: "Fork", href: "/fork" },
  { label: "About", href: "/about" },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();
  return (
    <>
      {menuLinks.map(({ label, href }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              className={`text-sm font-mono px-3 py-1.5 transition-colors ${
                isActive
                  ? "text-primary border-b border-primary"
                  : "text-base-content/50 hover:text-base-content"
              }`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </>
  );
};

export const Header = () => {
  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <header className="sticky top-0 z-20 w-full border-b border-[#1f1f1f] bg-[#0a0a0a]/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-mono font-bold text-sm">
          <span className="text-primary">ZK</span>
          <span className="text-base-content/50">/</span>
          <span>LLM</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center">
          <ul className="flex items-center gap-0">
            <HeaderMenuLinks />
          </ul>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/clawdbotatg/zk-api-credits"
            target="_blank"
            rel="noopener noreferrer"
            className="text-base-content/30 hover:text-base-content/70 transition-colors text-xs font-mono hidden md:block"
          >
            GitHub ↗
          </a>
          <RainbowKitCustomConnectButton />
        </div>
      </div>
    </header>
  );
};
