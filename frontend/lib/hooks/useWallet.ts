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

  if (walletId) {
    switch (walletId) {
      case "metamask":
        if (ethereum && (ethereum as any).isMetaMask)
          return ethereum;
        return null;
      case "okx":
        if (safeGet<any>("okxwallet")) return safeGet<any>("okxwallet") as ExtendedEip1193Provider;
        if (ethereum && ((ethereum as any).isOkxWallet || (ethereum as any).isOKX))
          return ethereum;
        return null;
      case "trust":
        if (safeGet<any>("Trust")) return safeGet<any>("Trust") as ExtendedEip1193Provider;
        if (safeGet<any>("trustwallet")) return safeGet<any>("trustwallet") as ExtendedEip1193Provider;
        if (ethereum && ((ethereum as any).isTrust || (ethereum as any).isTrustWallet))
          return ethereum;
        return null;
      case "walletconnect":
        if (safeGet<any>("WalletConnect")) return safeGet<any>("WalletConnect") as ExtendedEip1193Provider;
        if (ethereum) return ethereum;
        return null;
      case "coinbase":
        if (ethereum && (ethereum as any).isCoinbaseWallet)
          return ethereum;
        return null;
      case "rabby":
        if (ethereum && (ethereum as any).isRabby)
          return ethereum;
        return null;
      case "ledger":
        if (ethereum && (ethereum as any).isLedgerLive)
          return ethereum;
        return null;
      case "imtoken":
        if (ethereum && (ethereum as any).isImToken)
          return ethereum;
        return null;
      case "brave":
        if (ethereum && (ethereum as any).isBraveWallet)
          return ethereum;
        return null;
      default:
        // "any-evm" or unknown — use whatever is injected
        if (ethereum) return ethereum;
        return null;
    }
  }
  
  // No wallet selected — try providers in priority order
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

  // Check localStorage for previous connection on mount
  useEffect(() => {
    const wasConnected = localStorage.getItem(WALLET_STORAGE_KEY) === "true";
    if (wasConnected && typeof window !== "undefined" && checkWalletAvailable()) {
      handleReconnect();
    }
  }, []);

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
    
    // Standard EIP-1193 check
    if (ethereum) return true;
    
    // Mobile-specific checks
    // OKX Wallet Mobile - checks both the global and the injected provider
    if (safeGet<any>("okxwallet") || ethereum?.isOkxWallet || ethereum?.isOKX) return true;
    
    // WalletConnect mobile (injected by WalletConnect SDK)
    if (safeGet<any>("WalletConnect")) return true;
    
    // Trust Wallet Mobile - checks both global and injected provider
    if (safeGet<any>("Trust") || safeGet<any>("trustwallet") || ethereum?.isTrust || ethereum?.isTrustWallet) return true;
    
    return false;
  }, []);

  const handleReconnect = useCallback(async () => {
    const providerInstance = await getWalletProvider();
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
        await ensureGalileoNetwork();
        
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
        throw new Error("No Ethereum wallet detected");
      }
      
      const browserProvider = new BrowserProvider(provider);
      
      // Request accounts (this will prompt the user - single popup)
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      
      if (accounts && accounts.length > 0) {
        const signer = await browserProvider.getSigner();
        const address = await signer.getAddress();
        
        // Ensure we're on 0G network
        await ensureGalileoNetwork();
        
        // Save connection state to localStorage
        localStorage.setItem(WALLET_STORAGE_KEY, "true");
        
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

  // Listen for account changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Get the current provider instance to listen to
    const providerInstance = window.ethereum as ExtendedEip1193Provider | undefined;
    if (!providerInstance) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as unknown[];
      if (!accounts || accounts.length === 0) {
        disconnect();
      } else {
        handleReconnect();
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      // When chain changes, we should reconnect to ensure we're on Galileo
      disconnect();
    };

    providerInstance.on("accountsChanged", handleAccountsChanged);
    providerInstance.on("chainChanged", handleChainChanged);

    return () => {
      if (providerInstance) {
        providerInstance.removeListener("accountsChanged", handleAccountsChanged);
        providerInstance.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [disconnect, handleReconnect]);

  return {
    ...state,
    connect,
    disconnect,
    hasWallet: typeof window !== "undefined" && checkWalletAvailable(),
  };
}

export type { WalletState };