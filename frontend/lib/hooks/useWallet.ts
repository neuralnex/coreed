"use client";

import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { ensureGalileoNetwork } from "../wallet";
import type { ExtendedEip1193Provider } from "../wallet";

interface WalletState {
  address: string | null;
  signer: JsonRpcSigner | null;
  provider: BrowserProvider | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
}

const WALLET_STORAGE_KEY = "coreed_wallet_connected";

interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: ExtendedEip1193Provider;
}

// Global store of discovered providers to avoid multiple listeners or missing early events
let globalAnnouncedProviders: EIP6963ProviderDetail[] = [];
if (typeof window !== "undefined") {
  const handleAnnounce = (event: any) => {
    if (event.detail && event.detail.info && event.detail.provider) {
      if (!globalAnnouncedProviders.some(p => p.info.uuid === event.detail.info.uuid)) {
        globalAnnouncedProviders.push(event.detail);
      }
    }
  };
  window.addEventListener("eip6963:announceProvider", handleAnnounce as EventListener);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

/**
 * Gets the appropriate wallet provider, handling both desktop and mobile wallets
 * Mobile wallets may inject their provider in different ways
 */
async function getWalletProvider(walletId?: string): Promise<ExtendedEip1193Provider | null> {
  if (typeof window === "undefined") return null;

  // Safe access to window properties to avoid redefinition errors from wallet extensions
  const safeGet = <T,>(key: string): T | null => {
    try {
      return (window as unknown as Record<string, T>)[key] ?? null;
    } catch {
      return null;
    }
  };

  const ethereum = safeGet<ExtendedEip1193Provider>("ethereum");

  // Force dispatch another request just in case some wallets loaded late
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  // Wait a tiny amount (e.g. 10ms) to allow late wallets to announce
  await new Promise(resolve => setTimeout(resolve, 10));

  if (walletId) {
    switch (walletId) {
      case "metamask": {
        const match = globalAnnouncedProviders.find(p => p.info.rdns === "io.metamask" || p.info.rdns.startsWith("io.metamask"));
        if (match) return match.provider;
        if (ethereum && (ethereum as any).isMetaMask)
          return ethereum;
        return null;
      }
      case "okx": {
        const match = globalAnnouncedProviders.find(p => p.info.rdns === "com.okex.wallet" || p.info.name.toLowerCase().includes("okx"));
        if (match) return match.provider;
        if (safeGet<any>("okxwallet")) return safeGet<any>("okxwallet") as ExtendedEip1193Provider;
        if (ethereum && ((ethereum as any).isOkxWallet || (ethereum as any).isOKX))
          return ethereum;
        return null;
      }
      case "trust": {
        const match = globalAnnouncedProviders.find(p => p.info.rdns === "com.trustwallet.app" || p.info.name.toLowerCase().includes("trust"));
        if (match) return match.provider;
        if (safeGet<any>("Trust")) return safeGet<any>("Trust") as ExtendedEip1193Provider;
        if (safeGet<any>("trustwallet")) return safeGet<any>("trustwallet") as ExtendedEip1193Provider;
        if (ethereum && ((ethereum as any).isTrust || (ethereum as any).isTrustWallet))
          return ethereum;
        return null;
      }
      case "coinbase": {
        const match = globalAnnouncedProviders.find(p => p.info.rdns === "com.coinbase.wallet" || p.info.name.toLowerCase().includes("coinbase"));
        if (match) return match.provider;
        if (ethereum && (ethereum as any).isCoinbaseWallet)
          return ethereum;
        return null;
      }
      case "rabby": {
        const match = globalAnnouncedProviders.find(p => p.info.rdns === "io.rabby" || p.info.name.toLowerCase().includes("rabby"));
        if (match) return match.provider;
        if (ethereum && (ethereum as any).isRabby)
          return ethereum;
        return null;
      }
      case "ledger": {
        const match = globalAnnouncedProviders.find(p => p.info.name.toLowerCase().includes("ledger"));
        if (match) return match.provider;
        if (ethereum && (ethereum as any).isLedgerLive)
          return ethereum;
        return null;
      }
      case "imtoken": {
        const match = globalAnnouncedProviders.find(p => p.info.name.toLowerCase().includes("imtoken"));
        if (match) return match.provider;
        if (ethereum && (ethereum as any).isImToken)
          return ethereum;
        return null;
      }
      case "brave": {
        const match = globalAnnouncedProviders.find(p => p.info.rdns === "com.brave.wallet" || p.info.name.toLowerCase().includes("brave"));
        if (match) return match.provider;
        if (ethereum && (ethereum as any).isBraveWallet)
          return ethereum;
        return null;
      }
      default: {
        if (globalAnnouncedProviders.length > 0) return globalAnnouncedProviders[0].provider;
        if (ethereum) return ethereum;
        return null;
      }
    }
  }
  
  // No wallet selected — try providers in priority order
  if (globalAnnouncedProviders.length > 0) {
    return globalAnnouncedProviders[0].provider;
  }
  if (ethereum) {
    return ethereum;
  }
  if (safeGet<any>("okxwallet")) {
    return safeGet<any>("okxwallet") as ExtendedEip1193Provider;
  }
  if (safeGet<any>("Trust")) {
    return safeGet<any>("Trust") as ExtendedEip1193Provider;
  }
  if (safeGet<any>("trustwallet")) {
    return safeGet<any>("trustwallet") as ExtendedEip1193Provider;
  }
  return null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    signer: null,
    provider: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  // Enhanced wallet detection for mobile and desktop
  const checkWalletAvailable = useCallback(() => {
    if (typeof window === "undefined") return false;
    
    // Safe access to window properties
    const safeGet = <T,>(key: string): T | null => {
      try {
        return (window as unknown as Record<string, T>)[key] ?? null;
      } catch {
        return null;
      }
    };

    const ethereum = safeGet<ExtendedEip1193Provider>("ethereum");
    
    // EIP-6963 check
    if (globalAnnouncedProviders.length > 0) return true;
    
    // Standard EIP-1193 check
    if (ethereum) return true;
    
    // Mobile-specific checks
    if (safeGet<any>("okxwallet") || (ethereum as any)?.isOkxWallet || (ethereum as any)?.isOKX) return true;
    if (safeGet<any>("WalletConnect")) return true;
    if (safeGet<any>("Trust") || safeGet<any>("trustwallet") || (ethereum as any)?.isTrust || (ethereum as any)?.isTrustWallet) return true;
    
    return false;
  }, []);

  const handleReconnect = useCallback(async (walletId?: string) => {
    const providerInstance = await getWalletProvider(walletId);
    if (!providerInstance) {
      localStorage.removeItem(WALLET_STORAGE_KEY);
      setState(prev => ({ ...prev, isConnecting: false, error: null }));
      return;
    }

    try {
      const provider = new BrowserProvider(providerInstance);
      
      // Try to get accounts without prompting
      const accounts = await provider.send("eth_accounts", []);
      
      if (accounts && accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        // Verify we're on the correct network
        await ensureGalileoNetwork(providerInstance);
        
        setState({
          address,
          signer,
          provider,
          isConnected: true,
          isConnecting: false,
          error: null,
        });
      }
    } catch (error) {
      // If reconnection fails, just clear the storage
      localStorage.removeItem(WALLET_STORAGE_KEY);
      setState(prev => ({ ...prev, isConnecting: false, error: null }));
    }
  }, []);

  // Check localStorage for previous connection on mount
  useEffect(() => {
    const connectedWallet = localStorage.getItem(WALLET_STORAGE_KEY);
    if (connectedWallet && typeof window !== "undefined" && checkWalletAvailable()) {
      handleReconnect(connectedWallet === "true" ? undefined : connectedWallet);
    }
  }, [checkWalletAvailable, handleReconnect]);

  const connect = useCallback(async (walletId?: string) => {
    if (typeof window === "undefined") {
      setState(prev => ({
        ...prev,
        error: new Error("No Ethereum wallet detected. Install MetaMask or another EIP-1193 wallet."),
        isConnecting: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Get the provider, respecting wallet selection if provided
      const provider = await getWalletProvider(walletId);
      if (!provider) {
        if (walletId === "okx") {
          throw new Error("OKX Wallet extension not detected. Please install OKX Wallet or choose another option.");
        } else if (walletId === "metamask") {
          throw new Error("MetaMask extension not detected. Please install MetaMask or choose another option.");
        } else if (walletId === "trust") {
          throw new Error("Trust Wallet extension not detected. Please install Trust Wallet or choose another option.");
        } else if (walletId === "coinbase") {
          throw new Error("Coinbase Wallet extension not detected. Please install Coinbase Wallet or choose another option.");
        }
        throw new Error("No Ethereum wallet detected");
      }
      
      const browserProvider = new BrowserProvider(provider);
      
      // Request accounts (this will prompt the user - single popup)
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      
      if (accounts && accounts.length > 0) {
        const signer = await browserProvider.getSigner();
        const address = await signer.getAddress();
        
        // Ensure we're on 0G network
        await ensureGalileoNetwork(provider);
        
        // Resolve walletId to store
        let resolvedWalletId = walletId || "any-evm";
        if (resolvedWalletId === "any-evm" || !resolvedWalletId) {
          if (provider === (window as any).okxwallet || (provider as any)?.isOkxWallet || (provider as any)?.isOKX) {
            resolvedWalletId = "okx";
          } else if ((provider as any)?.isMetaMask) {
            resolvedWalletId = "metamask";
          } else if ((provider as any)?.isTrust || (provider as any)?.isTrustWallet || provider === (window as any).Trust || provider === (window as any).trustwallet) {
            resolvedWalletId = "trust";
          } else if ((provider as any)?.isCoinbaseWallet) {
            resolvedWalletId = "coinbase";
          }
        }

        // Save connection state to localStorage
        localStorage.setItem(WALLET_STORAGE_KEY, resolvedWalletId);
        
        setState({
          address,
          signer,
          provider: browserProvider,
          isConnected: true,
          isConnecting: false,
          error: null,
        });
      } else {
        throw new Error("No accounts found");
      }
    } catch (error) {
      localStorage.removeItem(WALLET_STORAGE_KEY);
      setState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error : new Error(String(error)),
        address: null,
        signer: null,
        provider: null,
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(WALLET_STORAGE_KEY);
    setState({
      address: null,
      signer: null,
      provider: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  }, []);

  // Listen for account changes on the active wallet provider
  useEffect(() => {
    if (typeof window === "undefined" || !state.isConnected) return;

    const activeWalletId = localStorage.getItem(WALLET_STORAGE_KEY) || undefined;
    let providerInstance: ExtendedEip1193Provider | null = null;
    let isSubscribed = true;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as unknown[];
      if (!accounts || accounts.length === 0) {
        disconnect();
      } else {
        handleReconnect(activeWalletId);
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      disconnect();
    };

    getWalletProvider(activeWalletId).then(prov => {
      if (!prov || !isSubscribed) return;
      providerInstance = prov;

      providerInstance.on("accountsChanged", handleAccountsChanged);
      providerInstance.on("chainChanged", handleChainChanged);
    });

    return () => {
      isSubscribed = false;
      if (providerInstance) {
        providerInstance.removeListener("accountsChanged", handleAccountsChanged);
        providerInstance.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [disconnect, handleReconnect, state.isConnected]);

  return {
    ...state,
    connect,
    disconnect,
    hasWallet: typeof window !== "undefined" && checkWalletAvailable(),
  };
}

export type { WalletState };