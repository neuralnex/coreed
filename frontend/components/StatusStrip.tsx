"use client";

import { useEffect, useState } from "react";
import { connectWallet, hasInjectedWallet, DEFAULT_CHAIN_ID } from "@/lib/wallet";
import type { JsonRpcSigner } from "ethers";

interface StatusStripProps {
  onConnect: (signer: JsonRpcSigner, address: string) => void;
  address: string | null;
}

export function StatusStrip({ onConnect, address }: StatusStripProps) {
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAvailable, setWalletAvailable] = useState(true);

  useEffect(() => {
    setWalletAvailable(hasInjectedWallet());
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const { signer, address } = await connectWallet();
      onConnect(signer, address);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <header className="border-b border-coreed-line">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-medium tracking-tight text-coreed-bone">
            coreed
          </span>
          <span className="h-3 w-px bg-coreed-line" aria-hidden />
          <span className="flex items-center gap-1.5 font-mono text-xs text-coreed-sage">
            <span className="h-1.5 w-1.5 rounded-full bg-coreed-moss-bright" aria-hidden />
            0G Galileo · {DEFAULT_CHAIN_ID}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {error && (
            <span className="font-mono text-xs text-coreed-clay" role="alert">
              {error}
            </span>
          )}
          {address ? (
            <span className="font-mono text-xs text-coreed-moss-bright">
              {address.slice(0, 6)}…{address.slice(-4)}
            </span>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting || !walletAvailable}
              className="rounded border border-coreed-line bg-coreed-panel-raised px-3 py-1.5 font-mono text-xs text-coreed-bone transition-colors hover:border-coreed-moss disabled:cursor-not-allowed disabled:opacity-50"
            >
              {!walletAvailable
                ? "no wallet found"
                : connecting
                ? "connecting…"
                : "connect wallet"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
