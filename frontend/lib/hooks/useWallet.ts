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

  // If a specific wallet was selected, try that provider first
  if (walletId) {
    switch (walletId) {
      case "okx":
        if (window.okxwallet) return window.okxwallet as unknown as ExtendedEip1193Provider;
        break;
      case "trust":
        if (window.Trust) return window.Trust as unknown as ExtendedEip1193Provider;
        if (window.trustwallet) return window.trustwallet as unknown as ExtendedEip1193Provider;
        break;
      case "walletconnect":
        if (window.WalletConnect) return window.WalletConnect as unknown as ExtendedEip1193Provider;
        break;
    }
  }
  
  // Standard EIP-1193 provider
  if (window.ethereum) {
    return window.ethereum as ExtendedEip1193Provider;
  }
  
  // OKX Wallet Mobile - may inject as window.okxwallet
  if (window.okxwallet) {
    return window.okxwallet as unknown as ExtendedEip1193Provider;
  }
  
  // Trust Wallet Mobile - may inject as window.Trust or window.trustwallet
  if (window.Trust) {
    return window.Trust as unknown as ExtendedEip1193Provider;
  }
  
  if (window.trustwallet) {
    return window.trustwallet as unknown as ExtendedEip1193Provider;
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
    
    // Standard EIP-1193 check
    if (window.ethereum) return true;
    
    // Mobile-specific checks
    // OKX Wallet Mobile - checks both the global and the injected provider
    if (window.okxwallet || (window.ethereum as unknown as ExtendedEip1193Provider)?.isOkxWallet || (window.ethereum as unknown as ExtendedEip1193Provider)?.isOKX) return true;
    
    // WalletConnect mobile (injected by WalletConnect SDK)
    if (window.WalletConnect) return true;
    
    // Trust Wallet Mobile - checks both global and injected provider
    if (window.Trust || window.trustwallet || (window.ethereum as unknown as ExtendedEip1193Provider)?.isTrust || (window.ethereum as unknown as ExtendedEip1193Provider)?.isTrustWallet) return true;
    
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