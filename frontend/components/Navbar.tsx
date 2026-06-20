"use client";

import Link from "next/link";
import { useWalletContext } from "@/lib/contexts/WalletContext";

export function Navbar() {
  const { address, isConnected, isConnecting, connect, disconnect, hasWallet, error } = useWalletContext();

  const formatAddress = (addr: string) => {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : null;
  };

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-coreed-panel border-b border-coreed-line/50 sticky top-0 z-50">
      <div className="flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-coreed-moss-bright to-coreed-clay bg-clip-text text-transparent">
            Coreed
          </span>
        </Link>

        {/* Network Badge */}
        <div className="hidden md:flex items-center gap-2">
          <span className="px-2 py-1 bg-coreed-moss/10 text-coreed-moss-bright text-xs rounded-full border border-coreed-moss/20">
            0G Galileo
          </span>
          <span className="text-xs text-coreed-sage">16602</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-8">
        <Link href="/" className="text-coreed-bone/70 hover:text-coreed-bone transition-colors">
          Launch
        </Link>
        <Link href="/playground" className="text-coreed-bone/70 hover:text-coreed-bone transition-colors">
          Playground
        </Link>
        <Link href="/hub" className="text-coreed-bone/70 hover:text-coreed-bone transition-colors">
          Hub
        </Link>
      </div>

      {/* Wallet Connection */}
      <div className="flex items-center gap-4">
        {isConnecting ? (
          <button disabled className="px-4 py-2 bg-coreed-moss/20 text-coreed-bone rounded-md text-sm">
            Connecting...
          </button>
        ) : isConnected && address ? (
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-coreed-panel-raised border border-coreed-line/30 rounded-md text-sm">
              {formatAddress(address)}
            </span>
            <button
              onClick={disconnect}
              className="px-3 py-1.5 text-coreed-sage hover:text-coreed-bone text-sm transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={hasWallet ? connect : undefined}
            disabled={!hasWallet || isConnecting}
            className="px-4 py-2 bg-coreed-moss hover:bg-coreed-moss-bright text-coreed-void rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {hasWallet ? "Connect Wallet" : "Install Wallet"}
          </button>
        )}
        
        {error && (
          <span className="text-red-500 text-sm">{error.message}</span>
        )}
      </div>
    </nav>
  );
}

export default Navbar;