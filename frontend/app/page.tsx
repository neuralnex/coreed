"use client";

import { useState, useCallback } from "react";
import type { JsonRpcSigner } from "ethers";
import { useWalletContext } from "@/lib/contexts/WalletContext";
import { Uploader } from "@/components/Uploader";
import Link from "next/link";

export default function Home() {
  const { signer, address, isConnected, hasWallet } = useWalletContext();
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);

  const handleRequireWallet = useCallback(() => {
    if (!isConnected) {
      setShowConnectPrompt(true);
    }
  }, [isConnected]);

  return (
    <div className="flex flex-col min-h-full">
      <main className="mx-auto flex max-w-6xl flex-1 flex-col px-6 py-12">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-coreed-moss-bright to-coreed-clay bg-clip-text text-transparent mb-4">
            LAUNCH AN AGENT
          </h1>
          <p className="max-w-2xl mx-auto text-coreed-sage text-lg leading-relaxed">
            Route payloads to 0G Storage & mint Agentic IDs
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center flex-grow">
          {showConnectPrompt && !isConnected && (
            <div className="mb-6 p-4 bg-coreed-panel-raised border border-coreed-clay/20 rounded-lg max-w-md">
              <p className="font-mono text-sm text-coreed-clay">
                Connect a wallet to launch an agent
              </p>
            </div>
          )}

          {/* Upload Card */}
          <div className="w-full max-w-2xl">
            <div className="mb-6">
              <label className="block text-sm font-medium text-coreed-bone/70 mb-2">
                Agent Name
              </label>
              <input
                type="text"
                placeholder="My AI Agent"
                className="w-full px-4 py-3 bg-coreed-panel border border-coreed-line/30 rounded-md text-coreed-bone placeholder-coreed-sage/50 focus:outline-none focus:ring-2 focus:ring-coreed-moss-bright/20 focus:border-coreed-moss-bright"
                disabled={!isConnected}
              />
            </div>

            {/* Drag & Drop Upload Zone */}
            <Uploader 
              signer={signer || null} 
              onRequireWallet={handleRequireWallet}
            />

            <div className="mt-4 text-center">
              <p className="text-sm text-coreed-sage/70">
                Only the 32-byte Merkle root crosses onto 0G Chain
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Links */}
        <div className="mt-12 flex flex-col gap-4 border-t border-coreed-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="font-mono text-xs text-coreed-sage">
                already have an agent ID?
              </p>
              <Link
                href="/playground"
                className="font-mono text-xs text-coreed-bone underline decoration-coreed-line decoration-1 underline-offset-2 hover:decoration-coreed-moss-bright"
              >
                open playground →
              </Link>
            </div>
            <div>
              <p className="font-mono text-xs text-coreed-sage">
                browse models
              </p>
              <Link
                href="/hub"
                className="font-mono text-xs text-coreed-bone underline decoration-coreed-line decoration-1 underline-offset-2 hover:decoration-coreed-moss-bright"
              >
                open model hub →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-coreed-line px-6 py-4">
        <p className="mx-auto max-w-4xl font-mono text-[11px] text-coreed-sage/70">
          built on 0g modular infrastructure — storage · chain · compute
        </p>
      </footer>
    </div>
  );
}
