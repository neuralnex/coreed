"use client";

import { BrowserProvider, JsonRpcSigner } from "ethers";

import type { Eip1193Provider } from "ethers";

interface ExtendedEip1193Provider extends Eip1193Provider {
  isMetaMask?: boolean;
  isOkxWallet?: boolean;
  isOKX?: boolean;
  isTrust?: boolean;
  isTrustWallet?: boolean;
  isCoinbaseWallet?: boolean;
  isRabby?: boolean;
  isBraveWallet?: boolean;
  isLedgerLive?: boolean;
  isImToken?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: ExtendedEip1193Provider;
    okxwallet?: any;
    WalletConnect?: any;
    Trust?: any;
    trustwallet?: any;
  }
}

// 0G Network Configurations
export const GALILEO_CHAIN_ID = 16602;
export const ARISTOTLE_CHAIN_ID = 16661;

export type { ExtendedEip1193Provider };

export const GALILEO_CHAIN_ID_HEX = "0x" + GALILEO_CHAIN_ID.toString(16);
export const ARISTOTLE_CHAIN_ID_HEX = "0x" + ARISTOTLE_CHAIN_ID.toString(16);

// Testnet (Galileo)
export const GALILEO_RPC_URL = "https://evmrpc-testnet.0g.ai";
export const GALILEO_EXPLORER_URL = "https://chainscan-galileo.0g.ai";

// Mainnet (Aristotle)
export const ARISTOTLE_RPC_URL = "https://evmrpc.0g.ai";
export const ARISTOTLE_EXPLORER_URL = "https://chainscan.0g.ai";

// Default to testnet for development
export const DEFAULT_CHAIN_ID = GALILEO_CHAIN_ID;
export const DEFAULT_RPC_URL = GALILEO_RPC_URL;
export const DEFAULT_EXPLORER_URL = GALILEO_EXPLORER_URL;
export const DEFAULT_CHAIN_ID_HEX = GALILEO_CHAIN_ID_HEX;

export const AGENT_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS ?? "";

export class WalletNotFoundError extends Error {
  constructor() {
    super("No Ethereum wallet detected. Install MetaMask or another EIP-1193 wallet.");
    this.name = "WalletNotFoundError";
  }
}

export function hasInjectedWallet(): boolean {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}

export async function connectWallet(): Promise<{ signer: JsonRpcSigner; address: string }> {
  if (!hasInjectedWallet()) {
    throw new WalletNotFoundError();
  }

  const provider = new BrowserProvider(window.ethereum!);
  await provider.send("eth_requestAccounts", []);

  await ensureGalileoNetwork();

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { signer, address };
}

export async function ensureGalileoNetwork(): Promise<void> {
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
            blockExplorerUrls: [GALILEO_EXPLORER_URL],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}
