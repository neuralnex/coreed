"use client";

import { BrowserProvider, JsonRpcSigner } from "ethers";

declare global {
  interface Window {
    ethereum?: import("ethers").Eip1193Provider & {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export const GALILEO_CHAIN_ID = 16602;
export const GALILEO_CHAIN_ID_HEX = "0x" + GALILEO_CHAIN_ID.toString(16);
export const GALILEO_RPC_URL = "https://evmrpc-testnet.0g.ai";
export const GALILEO_EXPLORER_URL = "https://chainscan-galileo.0g.ai";

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

async function ensureGalileoNetwork(): Promise<void> {
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
