"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useWalletContext } from "@/lib/contexts/WalletContext";
import { WalletConnector } from "./WalletConnector";

const NAV_LINKS = [
  { href: "/hub", label: "Models" },
  { href: "/spaces", label: "Spaces" },
  { href: "/playground", label: "Playground" },
  { href: "/docs", label: "Docs" },
];

export function Navbar() {
  const { address, isConnected, isConnecting, connect, disconnect, hasWallet } = useWalletContext();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleConnectClick = () => {
    if (hasWallet) {
      setShowWalletModal(true);
    } else {
      connect();
    }
  };

  const handleWalletSelect = async () => {
    setShowWalletModal(false);
    try { await connect(); } catch { /* ignore */ }
  };

  const toggleMobileMenu = () => setShowMobileMenu(!showMobileMenu);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setShowMobileMenu(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl">
        <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/15 rounded-full shadow-lg shadow-black/60">
          <div className="flex items-center justify-between px-8 h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Coreed"
                width={28}
                height={28}
                className="rounded"
                priority
              />
              <span className="text-lg font-bold tracking-tight text-white">
                Coreed
              </span>
            </Link>

            {/* Center nav links */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm text-white/50 hover:text-white rounded-full hover:bg-white/5 transition-all"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {isConnecting ? (
                <button disabled className="px-4 py-2 text-sm text-white/50 border border-white/10 rounded-full opacity-50">
                  Connecting...
                </button>
              ) : isConnected && address ? (
                <div className="flex items-center gap-3">
                  <span className="hidden sm:block px-3 py-1.5 text-sm text-white/60 border border-white/10 rounded-full">
                    {formatAddress(address)}
                  </span>
                  <button
                    onClick={disconnect}
                    className="text-sm text-white/40 hover:text-white/70 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    href="/docs"
                    className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-full transition-all"
                  >
                    Getting Started
                  </Link>
                <button
                  onClick={handleConnectClick}
                  className="px-4 py-2 text-sm font-medium text-black bg-modal-green hover:brightness-110 rounded-full transition-all"
                >
                  Connect Wallet
                </button>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 text-white/50 hover:text-white transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={showMobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="mt-2 md:hidden bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/15 rounded-lg shadow-lg shadow-black/60 px-6 py-4">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-3 text-sm text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 pt-2 border-t border-white/5">
                {isConnected && address ? (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-white/60">{formatAddress(address)}</span>
                    <button
                      onClick={() => { disconnect(); setShowMobileMenu(false); }}
                      className="text-sm text-white/40 hover:text-white/70"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 px-4 pt-2">
                    <Link
                      href="/docs"
                      className="w-full text-center px-4 py-3 text-sm font-medium text-white/60 border border-white/10 rounded-lg"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Getting Started
                    </Link>
                  <button
                    onClick={() => { handleConnectClick(); setShowMobileMenu(false); }}
                    className="w-full px-4 py-3 text-sm font-medium text-black bg-modal-green rounded-lg"
                  >
                    Connect Wallet
                  </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {showWalletModal && hasWallet && (
        <WalletConnector
          onClose={() => setShowWalletModal(false)}
          onConnect={handleWalletSelect}
        />
      )}
    </>
  );
}

export default Navbar;
