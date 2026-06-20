"use client";

import type { ExtendedEip1193Provider } from "../wallet";

/**
 * Wallet types supported by Coreed
 */
export type WalletType = 
  | "metamask"
  | "okx"
  | "trust"
  | "walletconnect"
  | "coinbase"
  | "rabby"
  | "ledger"
  | "imtoken"
  | "brave"
  | "unknown"
  | "none";

/**
 * Wallet information with detection and connection capabilities
 */
export interface WalletInfo {
  id: WalletType;
  name: string;
  icon: string;
  description: string;
  isAvailable: () => boolean;
  getProvider: () => ExtendedEip1193Provider | null;
}

/**
 * Check if the current device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent || ""
  );
}

/**
 * Check if the current browser is running in a mobile wallet's in-app browser
 */
export function isInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const userAgent = navigator.userAgent || "";
  
  // Check for OKX in-app browser
  if (/okx/i.test(userAgent)) return true;
  
  // Check for Trust Wallet in-app browser
  if (/trust/i.test(userAgent)) return true;
  
  // Check for MetaMask in-app browser
  if (/metamask/i.test(userAgent)) return true;
  
  // Check for general web3 browsers
  if (/web3/i.test(userAgent)) return true;
  
  return false;
}

/**
 * Detect the currently available wallet
 */
export function detectWallet(): WalletType {
  if (typeof window === "undefined") return "none";
  
  const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
  
  // Check for specific wallet identifiers
  if (ethereum?.isMetaMask) return "metamask";
  if (ethereum?.isOkxWallet || ethereum?.isOKX || window.okxwallet) return "okx";
  if (ethereum?.isTrust || ethereum?.isTrustWallet || window.Trust || window.trustwallet) return "trust";
  if (window.WalletConnect || (ethereum && isWalletConnectProvider(ethereum))) return "walletconnect";
  if (ethereum?.isCoinbaseWallet) return "coinbase";
  if (ethereum?.isRabby) return "rabby";
  if (ethereum?.isLedgerLive) return "ledger";
  if (ethereum?.isImToken) return "imtoken";
  if (ethereum?.isBraveWallet || (navigator as { brave?: any }).brave) return "brave";
  
  // If ethereum exists but we can't identify the wallet
  if (ethereum) return "unknown";
  
  return "none";
}

/**
 * Check if a provider is WalletConnect
 */
function isWalletConnectProvider(provider: any): boolean {
  return provider?.constructor?.name === "WalletConnectProvider" ||
         provider?.isWalletConnect === true;
}

/**
 * Get all available wallets with their information
 */
export function getAvailableWallets(): WalletInfo[] {
  const wallets: WalletInfo[] = [
    {
      id: "metamask",
      name: "MetaMask",
      icon: "🦊",
      description: "Popular browser extension wallet",
      isAvailable: () => {
        if (typeof window === "undefined") return false;
        const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
        return Boolean(ethereum?.isMetaMask);
      },
      getProvider: () => {
        if (typeof window === "undefined") return null;
        const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
        return ethereum?.isMetaMask ? ethereum : null;
      }
    },
    {
      id: "okx",
      name: "OKX Wallet",
      icon: "🔶",
      description: "Multi-chain wallet for Web3",
      isAvailable: () => {
        if (typeof window === "undefined") return false;
        const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
        return Boolean(
          ethereum?.isOkxWallet ||
          ethereum?.isOKX ||
          window.okxwallet
        );
      },
      getProvider: () => {
        if (typeof window === "undefined") return null;
        const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
        if (ethereum?.isOkxWallet || ethereum?.isOKX) return ethereum;
        if (window.okxwallet) return window.okxwallet as unknown as ExtendedEip1193Provider;
        return null;
      }
    },
    {
      id: "trust",
      name: "Trust Wallet",
      icon: "🔒",
      description: "Mobile wallet with browser extension",
      isAvailable: () => {
        if (typeof window === "undefined") return false;
        const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
        return Boolean(
          ethereum?.isTrust ||
          ethereum?.isTrustWallet ||
          window.Trust ||
          window.trustwallet
        );
      },
      getProvider: () => {
        if (typeof window === "undefined") return null;
        const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
        if (ethereum?.isTrust || ethereum?.isTrustWallet) return ethereum;
        if (window.Trust) return window.Trust as unknown as ExtendedEip1193Provider;
        if (window.trustwallet) return window.trustwallet as unknown as ExtendedEip1193Provider;
        return null;
      }
    },
    {
      id: "walletconnect",
      name: "WalletConnect",
      icon: "🔗",
      description: "Connect mobile wallets via QR code",
      isAvailable: () => {
        if (typeof window === "undefined") return false;
        const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
        return Boolean(
          window.WalletConnect ||
          (ethereum && isWalletConnectProvider(ethereum))
        );
      },
      getProvider: () => {
        if (typeof window === "undefined") return null;
        const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
        if (ethereum && isWalletConnectProvider(ethereum)) return ethereum;
        if (window.WalletConnect) return window.WalletConnect as unknown as ExtendedEip1193Provider;
        return null;
      }
    },
    {
      id: "coinbase",
      name: "Coinbase Wallet",
      icon: "💰",
      description: "Coinbase's browser extension and mobile wallet",
      isAvailable: () => {
        if (typeof window === "undefined") return false;
        const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
        return Boolean(ethereum?.isCoinbaseWallet);
      },
      getProvider: () => {
        if (typeof window === "undefined") return null;
        const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
        return ethereum?.isCoinbaseWallet ? ethereum : null;
      }
    },
    {
      id: "rabby",
      name: "Rabby",
      icon: "🐰",
      description: "Smart wallet for DeFi",
      isAvailable: () => {
        if (typeof window === "undefined") return false;
        const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
        return Boolean(ethereum?.isRabby);
      },
      getProvider: () => {
        if (typeof window === "undefined") return null;
        const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
        return ethereum?.isRabby ? ethereum : null;
      }
    },
    {
      id: "ledger",
      name: "Ledger Live",
      icon: "🔌",
      description: "Hardware wallet with browser extension",
      isAvailable: () => {
        if (typeof window === "undefined") return false;
        const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
        return Boolean(ethereum?.isLedgerLive);
      },
      getProvider: () => {
        if (typeof window === "undefined") return null;
        const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
        return ethereum?.isLedgerLive ? ethereum : null;
      }
    },
    {
      id: "imtoken",
      name: "imToken",
      icon: "📱",
      description: "Mobile wallet for DeFi",
      isAvailable: () => {
        if (typeof window === "undefined") return false;
        const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
        return Boolean(ethereum?.isImToken);
      },
      getProvider: () => {
        if (typeof window === "undefined") return null;
        const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
        return ethereum?.isImToken ? ethereum : null;
      }
    },
    {
      id: "brave",
      name: "Brave Wallet",
      icon: "🦁",
      description: "Built-in wallet for Brave browser",
      isAvailable: () => {
        if (typeof window === "undefined") return false;
        const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
        return Boolean(
          ethereum?.isBraveWallet ||
          (navigator as { brave?: any }).brave
        );
      },
      getProvider: () => {
        if (typeof window === "undefined") return null;
        const ethereum = window.ethereum as ExtendedEip1193Provider | undefined;
        return ethereum?.isBraveWallet ? ethereum : null;
      }
    }
  ];
  
  return wallets;
}

/**
 * Get the primary available wallet provider
 */
export function getPrimaryWalletProvider(): ExtendedEip1193Provider | null {
  if (typeof window === "undefined") return null;
  
  // First check standard ethereum
  if (window.ethereum) {
    return window.ethereum as ExtendedEip1193Provider;
  }
  
  // Check mobile wallet globals
  if (window.okxwallet) {
    return window.okxwallet as unknown as ExtendedEip1193Provider;
  }
  
  if (window.Trust) {
    return window.Trust as unknown as ExtendedEip1193Provider;
  }
  
  if (window.trustwallet) {
    return window.trustwallet as unknown as ExtendedEip1193Provider;
  }
  
  if (window.WalletConnect) {
    return window.WalletConnect as unknown as ExtendedEip1193Provider;
  }
  
  return null;
}

/**
 * Check if any wallet is available
 */
export function hasWallet(): boolean {
  return detectWallet() !== "none";
}

/**
 * Get recommended wallets for mobile devices
 */
export function getRecommendedMobileWallets(): WalletInfo[] {
  return getAvailableWallets().filter(wallet => 
    ["okx", "trust", "metamask", "walletconnect"].includes(wallet.id)
  );
}

/**
 * Get recommended wallets for desktop devices
 */
export function getRecommendedDesktopWallets(): WalletInfo[] {
  return getAvailableWallets().filter(wallet => 
    ["metamask", "okx", "coinbase", "rabby", "ledger", "brave"].includes(wallet.id)
  );
}
