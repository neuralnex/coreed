"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useWalletContext } from "@/lib/contexts/WalletContext";
import { WalletConnector } from "./WalletConnector";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const { address, isConnected, isConnecting, connect, disconnect, hasWallet, error } = useWalletContext();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const formatAddress = (addr: string) => {
    return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : null;
  };

  const handleConnectClick = () => {
    if (hasWallet) {
      setShowWalletModal(true);
    } else {
      connect();
    }
  };

  const handleWalletSelect = async (walletId: string) => {
    setShowWalletModal(false);
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const toggleMobileMenu = () => setShowMobileMenu(!showMobileMenu);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowMobileMenu(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <nav className="flex items-center justify-between px-4 py-3 bg-coreed-panel border-b border-coreed-line/50 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-md hover:bg-coreed-panel-raised transition-colors touch-manipulation active:scale-[0.98] min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Toggle menu"
            aria-expanded={showMobileMenu}
          >
            <span className="text-xl">☰</span>
          </button>
          
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Coreed Logo"
              width={32}
              height={32}
              className="rounded"
              priority
            />
            <span className="text-xl font-bold bg-gradient-to-r from-coreed-moss-bright to-coreed-clay bg-clip-text text-transparent">
              Coreed
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-2">
            <span className="px-2 py-1 bg-coreed-moss/10 text-coreed-moss-bright text-xs rounded-full border border-coreed-moss/20">
              0G Galileo
            </span>
            <span className="text-xs text-coreed-sage">16602</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-coreed-bone/70 hover:text-coreed-bone transition-colors touch-manipulation active:scale-[0.98] min-h-[44px] px-2 py-2">
            Launch
          </Link>
          <Link href="/playground" className="text-coreed-bone/70 hover:text-coreed-bone transition-colors touch-manipulation active:scale-[0.98] min-h-[44px] px-2 py-2">
            Playground
          </Link>
          <Link href="/hub" className="text-coreed-bone/70 hover:text-coreed-bone transition-colors touch-manipulation active:scale-[0.98] min-h-[44px] px-2 py-2">
            Hub
          </Link>
          <Link href="/docs" className="text-coreed-bone/70 hover:text-coreed-bone transition-colors touch-manipulation active:scale-[0.98] min-h-[44px] px-2 py-2">
            Docs
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {isConnecting ? (
            <button disabled className="px-4 py-2.5 bg-coreed-moss/20 text-coreed-bone rounded-md text-sm min-h-[40px] touch-manipulation">
              Connecting...
            </button>
          ) : isConnected && address ? (
            <div className="hidden md:flex items-center gap-2">
              <span className="px-3 py-1.5 bg-coreed-panel-raised border border-coreed-line/30 rounded-md text-sm">
                {formatAddress(address)}
              </span>
              <button
                onClick={disconnect}
                className="px-3 py-1.5 text-coreed-sage hover:text-coreed-bone text-sm transition-colors min-h-[40px] touch-manipulation active:scale-[0.98]"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectClick}
              disabled={isConnecting}
              className="px-4 py-2.5 bg-coreed-moss hover:bg-coreed-moss-bright text-coreed-void rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] w-full md:w-auto touch-manipulation active:scale-[0.98]"
            >
              {hasWallet ? "Connect Wallet" : "Install Wallet"}
            </button>
          )}
          
          {error && (
            <span className="text-red-500 text-sm">{error.message}</span>
          )}
          
          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </nav>
      
      {showMobileMenu && (
        <div className="md:hidden bg-coreed-panel border-b border-coreed-line/50 px-4 py-3">
          <div className="flex flex-col gap-3">
            <Link href="/" className="text-coreed-bone/70 hover:text-coreed-bone transition-colors touch-manipulation active:scale-[0.98] min-h-[44px] px-2 py-2" onClick={() => setShowMobileMenu(false)}>
              Launch
            </Link>
            <Link href="/playground" className="text-coreed-bone/70 hover:text-coreed-bone transition-colors touch-manipulation active:scale-[0.98] min-h-[44px] px-2 py-2" onClick={() => setShowMobileMenu(false)}>
              Playground
            </Link>
            <Link href="/hub" className="text-coreed-bone/70 hover:text-coreed-bone transition-colors touch-manipulation active:scale-[0.98] min-h-[44px] px-2 py-2" onClick={() => setShowMobileMenu(false)}>
              Hub
            </Link>
            <Link href="/docs" className="text-coreed-bone/70 hover:text-coreed-bone transition-colors touch-manipulation active:scale-[0.98] min-h-[44px] px-2 py-2" onClick={() => setShowMobileMenu(false)}>
              Docs
            </Link>
            <div className="flex items-center gap-2 pt-2 border-t border-coreed-line/30">
              <span className="px-2 py-1 bg-coreed-moss/10 text-coreed-moss-bright text-xs rounded-full border border-coreed-moss/20">
                0G Galileo
              </span>
              <span className="text-xs text-coreed-sage">16602</span>
            </div>
            {isConnected && address && (
              <div className="flex items-center gap-2 pt-2 border-t border-coreed-line/30">
                <span className="px-3 py-1.5 bg-coreed-panel-raised border border-coreed-line/30 rounded-md text-sm">
                  {formatAddress(address)}
                </span>
                <button
                  onClick={() => {
                    disconnect();
                    setShowMobileMenu(false);
                  }}
                  className="px-3 py-1.5 text-coreed-sage hover:text-coreed-bone text-sm transition-colors min-h-[40px] touch-manipulation active:scale-[0.98]"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
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
