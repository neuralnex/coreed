"use client";

import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { GALILEO_CHAIN_ID_HEX, GALILEO_RPC_URL } from "../wallet";
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
    if (wasConnected && typeof window !== "undefined" && window.ethereum) {
      handleReconnect();
    }
  }, []);

  const handleReconnect = useCallback(async () => {
    if (!window.ethereum) {
      localStorage.removeItem(WALLET_STORAGE_KEY);
      setState(prev => ({ ...prev, isConnecting: false, error: null }));
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      
      // Try to get accounts without prompting
      const accounts = await provider.send("eth_accounts", []);
      
      if (accounts && accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        // Verify we're on the correct network
        await ensureGalileoNetwork(provider);
        
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

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setState(prev => ({
        ...prev,
        error: new Error("No Ethereum wallet detected. Install MetaMask or another EIP-1193 wallet."),
        isConnecting: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      if (!window.ethereum) {
        throw new Error("No Ethereum wallet detected");
      }
      
      const provider = new BrowserProvider(window.ethereum);
      
      // Request accounts (this will prompt the user)
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts && accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        // Ensure we're on Galileo network
        await ensureGalileoNetwork(provider);
        
        // Save connection state to localStorage
        localStorage.setItem(WALLET_STORAGE_KEY, "true");
        
        setState({
          address,
          signer,
          provider,
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
    if (typeof window === "undefined" || !window.ethereum) return;

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

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [disconnect, handleReconnect]);

  return {
    ...state,
    connect,
    disconnect,
    hasWallet: typeof window !== "undefined" && Boolean(window.ethereum),
  };
}

async function ensureGalileoNetwork(provider: BrowserProvider): Promise<void> {
  if (!window.ethereum) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: GALILEO_CHAIN_ID_HEX }],
    });
  } catch (switchError: unknown) {
    const err = switchError as { code?: number };
    if (err?.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: GALILEO_CHAIN_ID_HEX,
            chainName: "0G Galileo Testnet",
            nativeCurrency: { name: "OG", symbol: "OG", decimals: 18 },
            rpcUrls: [GALILEO_RPC_URL],
            blockExplorerUrls: ["https://chainscan-galileo.0g.ai"],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

export type { WalletState };