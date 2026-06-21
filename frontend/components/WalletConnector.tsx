"use client";

import { useState } from "react";
import { useWalletContext } from "@/lib/contexts/WalletContext";

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  available: () => boolean;
  connect: () => Promise<void>;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: "any-evm",
    name: "Any EVM Wallet",
    icon: "✨",
    description: "Connect any EIP-1193 compatible wallet",
    available: () => {
      if (typeof window === "undefined") return false;
      return Boolean(window.ethereum);
    },
    connect: async () => {}
  },
  {
    id: "metamask",
    name: "MetaMask",
    icon: "🦊",
    description: "Popular browser extension wallet",
    available: () => {
      if (typeof window === "undefined") return false;
      const ethereum = window.ethereum;
      if (!ethereum) return false;
      return Boolean((ethereum as { isMetaMask?: boolean }).isMetaMask);
    },
    connect: async () => {}
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: "🔶",
    description: "Multi-chain wallet for Web3",
    available: () => {
      if (typeof window === "undefined") return false;
      const ethereum = window.ethereum;
      // Check both the injected provider and the mobile global
      return Boolean(
        ethereum?.isOkxWallet ||
        ethereum?.isOKX ||
        window.okxwallet
      );
    },
    connect: async () => {}
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: "🔗",
    description: "Connect mobile wallets via QR code",
    available: () => {
      if (typeof window === "undefined") return false;
      return Boolean(window.ethereum || window.WalletConnect);
    },
    connect: async () => {}
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "💰",
    description: "Coinbase's browser extension and mobile wallet",
    available: () => {
      if (typeof window === "undefined") return false;
      const ethereum = window.ethereum;
      if (!ethereum) return false;
      return Boolean((ethereum as { isCoinbaseWallet?: boolean }).isCoinbaseWallet);
    },
    connect: async () => {}
  },
  {
    id: "rabby",
    name: "Rabby",
    icon: "🐰",
    description: "Smart wallet for DeFi",
    available: () => {
      if (typeof window === "undefined") return false;
      const ethereum = window.ethereum;
      if (!ethereum) return false;
      return Boolean((ethereum as { isRabby?: boolean }).isRabby);
    },
    connect: async () => {}
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: "🔒",
    description: "Mobile wallet with browser extension",
    available: () => {
      if (typeof window === "undefined") return false;
      const ethereum = window.ethereum;
      // Check both the injected provider and mobile globals
      return Boolean(
        ethereum?.isTrust ||
        ethereum?.isTrustWallet ||
        window.Trust ||
        window.trustwallet
      );
    },
    connect: async () => {}
  },
  {
    id: "ledger",
    name: "Ledger Live",
    icon: "🔌",
    description: "Hardware wallet with browser extension",
    available: () => {
      if (typeof window === "undefined") return false;
      const ethereum = window.ethereum;
      if (!ethereum) return false;
      return Boolean((ethereum as { isLedgerLive?: boolean }).isLedgerLive);
    },
    connect: async () => {}
  },
  {
    id: "imtoken",
    name: "imToken",
    icon: "📱",
    description: "Mobile wallet for DeFi",
    available: () => {
      if (typeof window === "undefined") return false;
      const ethereum = window.ethereum;
      if (!ethereum) return false;
      return Boolean((ethereum as { isImToken?: boolean }).isImToken);
    },
    connect: async () => {}
  },
  {
    id: "brave",
    name: "Brave Wallet",
    icon: "🦁",
    description: "Built-in wallet for Brave browser",
    available: () => {
      if (typeof window === "undefined") return false;
      const ethereum = window.ethereum;
      if (!ethereum) return false;
      return Boolean(
        (ethereum as { isBraveWallet?: boolean }).isBraveWallet ||
        (navigator as { brave?: any }).brave
      );
    },
    connect: async () => {}
  }
];

interface WalletConnectorProps {
  onClose: () => void;
  onConnect: (walletId: string) => void;
}

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent || ""
  );
}

export function WalletConnector({ onClose, onConnect }: WalletConnectorProps) {
  const { hasWallet } = useWalletContext();
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableWallets = WALLET_OPTIONS.filter(w => w.available());
  const allWallets = hasWallet ? WALLET_OPTIONS : availableWallets;

  const handleConnect = async (walletId: string) => {
    const wallet = WALLET_OPTIONS.find(w => w.id === walletId);
    if (!wallet) return;

    setIsConnecting(walletId);
    setError(null);

    try {
      await wallet.connect();
      onConnect(walletId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsConnecting(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4">
      <div className="bg-coreed-panel border border-coreed-line/50 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-coreed-bone">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="text-coreed-sage hover:text-coreed-bone text-2xl touch-manipulation active:scale-90"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="text-coreed-sage/70 text-sm mb-6">
          Choose a wallet to connect to Coreed. We support all EIP-1193 compatible EVM wallets including OKX, Trust Wallet, and MetaMask Mobile.
        </p>
        {isMobileDevice() && (
          <div className="mb-4 p-3 bg-coreed-moss/10 border border-coreed-moss/30 rounded-md">
            <p className="text-coreed-moss-bright text-sm">
              📱 On mobile? We support OKX Wallet, Trust Wallet, and MetaMask Mobile. 
              Make sure your wallet's browser is connected.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-md">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          {allWallets.map((wallet) => {
            const isConnectingThis = isConnecting === wallet.id;
            const isAvailable = wallet.available();

            return (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet.id)}
                disabled={isConnectingThis || (!hasWallet && !isAvailable)}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 touch-manipulation active:scale-[0.98] ${
                  isConnectingThis
                    ? "border-coreed-moss/50 bg-coreed-moss/10 cursor-wait"
                    : "border-coreed-line/30 hover:border-coreed-moss/50 hover:bg-coreed-panel-raised cursor-pointer"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="text-2xl">{wallet.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium text-coreed-bone">{wallet.name}</div>
                  <div className="text-sm text-coreed-sage/70">{wallet.description}</div>
                </div>
                {isConnectingThis && (
                  <span className="text-coreed-moss-bright text-sm whitespace-nowrap">Connecting...</span>
                )}
                {!hasWallet && !isAvailable && (
                  <span className="text-coreed-sage/50 text-sm whitespace-nowrap">Not detected</span>
                )}
              </button>
            );
          })}
        </div>

        {!hasWallet && availableWallets.length === 0 && (
          <div className="mt-6 p-4 bg-coreed-panel-raised border border-coreed-line/30 rounded-lg">
            <p className="text-coreed-sage text-sm mb-3">
              No Web3 wallet detected. Please install a wallet.
            </p>
            {isMobileDevice() ? (
              <p className="text-coreed-sage/70 text-xs mb-3">
                On mobile, we recommend OKX Wallet, Trust Wallet, or MetaMask Mobile
              </p>
            ) : (
              <p className="text-coreed-sage/70 text-xs mb-3">
                On desktop, we recommend MetaMask, OKX Wallet, or Coinbase Wallet
              </p>
            )}
            <div className="flex gap-3">
              <a
                href="https://www.okx.com/web3" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-coreed-moss-bright hover:text-coreed-moss text-sm font-medium"
              >
                OKX Wallet →
              </a>
              <a
                href="https://metamask.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-coreed-moss-bright hover:text-coreed-moss text-sm font-medium"
              >
                MetaMask →
              </a>
              <a
                href="https://trustwallet.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-coreed-moss-bright hover:text-coreed-moss text-sm font-medium"
              >
                Trust Wallet →
              </a>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-coreed-line/30">
          <p className="text-xs text-coreed-sage/50 text-center">
            By connecting, you agree to Coreed's Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}

export function useWalletModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  const handleConnect = (walletId: string) => {
    setSelectedWallet(walletId);
    closeModal();
  };

  return {
    isOpen,
    selectedWallet,
    openModal,
    closeModal,
    handleConnect,
    Modal: isOpen ? (
      <WalletConnector onClose={closeModal} onConnect={handleConnect} />
    ) : null
  };
}
