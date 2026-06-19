"use client";

import { useState } from "react";
import type { JsonRpcSigner } from "ethers";
import Link from "next/link";
import { StatusStrip } from "@/components/StatusStrip";
import { ResolvingHash } from "@/components/ResolvingHash";
import { useAgentRegistry, type AgentMeta } from "@/lib/useAgentRegistry";
import { GALILEO_EXPLORER_URL } from "@/lib/wallet";

export default function Playground() {
  const [, setSigner] = useState<JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [agent, setAgent] = useState<AgentMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getAgent } = useAgentRegistry();

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setAgent(null);

    try {
      const result = await getAgent(query.trim());
      setAgent(result);
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes("AgentDoesNotExist")
          ? `No agent found with ID ${query.trim()}.`
          : err instanceof Error
          ? err.message
          : "Lookup failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <StatusStrip
        address={address}
        onConnect={(s, addr) => {
          setSigner(s);
          setAddress(addr);
        }}
      />

      <main className="mx-auto flex max-w-4xl flex-1 flex-col px-6 py-12">
        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <h1 className="font-mono text-2xl font-medium tracking-tight text-coreed-bone">
              playground
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-coreed-sage">
              Look up a registered Agentic ID to inspect its on-chain metadata.
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/"
              className="font-mono text-xs text-coreed-sage hover:text-coreed-bone"
            >
              ← launch
            </Link>
            <Link
              href="/hub"
              className="font-mono text-xs text-coreed-sage hover:text-coreed-bone"
            >
              🏛️ hub
            </Link>
          </div>
        </div>

        <form onSubmit={handleLookup} className="coreed-panel rounded-lg p-6">
          <label htmlFor="agent-id" className="mb-1.5 block font-mono text-xs text-coreed-sage">
            agentic id
          </label>
          <div className="flex gap-2">
            <input
              id="agent-id"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="1"
              inputMode="numeric"
              className="flex-1 rounded border border-coreed-line bg-coreed-void px-3 py-2 font-mono text-sm text-coreed-bone placeholder:text-coreed-sage/50 focus:border-coreed-moss"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded border border-coreed-line bg-coreed-panel-raised px-4 py-2 font-mono text-xs text-coreed-bone transition-colors hover:border-coreed-moss disabled:opacity-50"
            >
              {loading ? "querying…" : "query"}
            </button>
          </div>

          {error && (
            <p className="mt-4 font-mono text-xs text-coreed-clay" role="alert">
              {error}
            </p>
          )}

          {agent && (
            <dl className="mt-6 space-y-4 border-t border-coreed-line pt-5">
              <div>
                <dt className="font-mono text-xs text-coreed-sage">name</dt>
                <dd className="mt-1 font-mono text-sm text-coreed-bone">{agent.name}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-coreed-sage">storage root hash</dt>
                <dd className="mt-1">
                  <ResolvingHash value={agent.storageRootHash} pending={false} className="text-sm" />
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-coreed-sage">developer</dt>
                <dd className="mt-1 font-mono text-sm text-coreed-bone">
                  {agent.developer.slice(0, 10)}…{agent.developer.slice(-8)}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-coreed-sage">launched</dt>
                <dd className="mt-1 font-mono text-sm text-coreed-bone">
                  {new Date(agent.launchTimestamp * 1000).toLocaleString()}
                </dd>
              </div>
              <div className="pt-1">
                <a
                  href={`${GALILEO_EXPLORER_URL}/address/${agent.developer}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-coreed-bone underline decoration-coreed-line decoration-1 underline-offset-2 hover:decoration-coreed-moss-bright"
                >
                  view developer on explorer ↗
                </a>
              </div>
            </dl>
          )}
        </form>
      </main>
    </>
  );
}
