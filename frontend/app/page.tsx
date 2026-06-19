"use client";

import { useState } from "react";
import type { JsonRpcSigner } from "ethers";
import { StatusStrip } from "@/components/StatusStrip";
import { Uploader } from "@/components/Uploader";
import Link from "next/link";

export default function Home() {
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);

  return (
    <>
      <StatusStrip
        address={address}
        onConnect={(s, addr) => {
          setSigner(s);
          setAddress(addr);
          setShowConnectPrompt(false);
        }}
      />

      <main className="mx-auto flex max-w-4xl flex-1 flex-col px-6 py-12">
        <div className="mb-8">
          <h1 className="font-mono text-2xl font-medium tracking-tight text-coreed-bone">
            launch an agent
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-coreed-sage">
            Upload model weights or a system prompt config. Coreed routes the
            payload to 0G Storage and mints an Agentic ID bound to its root
            hash on 0G Chain.
          </p>
        </div>

        {showConnectPrompt && !signer && (
          <p className="mb-4 font-mono text-xs text-coreed-clay" role="alert">
            connect a wallet to launch an agent
          </p>
        )}

        <Uploader signer={signer} onRequireWallet={() => setShowConnectPrompt(true)} />

        <div className="mt-6 flex flex-col gap-3 border-t border-coreed-line pt-6 sm:flex-row sm:items-center sm:justify-between">
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
    </>
  );
}
