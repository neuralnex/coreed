"use client";

import { useState } from "react";
import Link from "next/link";
import { Library } from "lucide-react";
import { StatusStrip } from "@/components/StatusStrip";
import { ResolvingHash } from "@/components/ResolvingHash";
import { useAgentRegistry, type AgentMeta } from "@/lib/useAgentRegistry";
import { GALILEO_EXPLORER_URL } from "@/lib/wallet";
import { useWalletContext } from "@/lib/contexts/WalletContext";

export default function Playground() {
  const { address } = useWalletContext();
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
    <div className="flex flex-col min-h-full">
      <StatusStrip />

      <main className="flex-1 flex-col">
        {/* Hero Section */}
        <section className="px-6 py-16 md:py-24">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12 flex flex-col sm:flex-row items-baseline justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-modal-green mb-2 block">
                  Agent Lookup
                </span>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
                  playground
                </h1>
                <p className="text-modal-text-dim">
                  Look up a registered Agentic ID to inspect its on-chain metadata.
                </p>
              </div>
              <div className="flex gap-4">
                <Link
                  href="/"
                  className="modal-button-secondary"
                >
                  ← launch
                </Link>
                <Link
                  href="/hub"
                  className="modal-button-secondary"
                >
                  <Library className="inline-block w-4 h-4 mr-1 -mt-0.5" /> hub
                </Link>
              </div>
            </div>

            <form onSubmit={handleLookup} className="modal-card">
              <label htmlFor="agent-id" className="mb-1.5 block font-mono text-xs text-modal-text-dim">
                agentic id
              </label>
              <div className="flex gap-2">
                <input
                  id="agent-id"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="1"
                  inputMode="numeric"
                  className="flex-1 rounded-lg border border-modal-border bg-black px-3 py-2 font-mono text-sm text-white placeholder:text-modal-text-dim/50 focus:border-modal-green focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="modal-button-primary"
                >
                  {loading ? "querying…" : "query"}
                </button>
              </div>

              {error && (
                <p className="mt-4 font-mono text-xs text-red-400" role="alert">
                  {error}
                </p>
              )}

              {agent && (
                <dl className="mt-6 space-y-4 border-t border-modal-border pt-5">
                  <div>
                    <dt className="font-mono text-xs text-modal-text-dim">name</dt>
                    <dd className="mt-1 font-mono text-sm text-white">{agent.name}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs text-modal-text-dim">storage root hash</dt>
                    <dd className="mt-1">
                      <ResolvingHash value={agent.storageRootHash} pending={false} className="text-sm" />
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs text-modal-text-dim">developer</dt>
                    <dd className="mt-1 font-mono text-sm text-white">
                      {agent.developer.slice(0, 10)}…{agent.developer.slice(-8)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-xs text-modal-text-dim">launched</dt>
                    <dd className="mt-1 font-mono text-sm text-white">
                      {new Date(agent.launchTimestamp * 1000).toLocaleString()}
                    </dd>
                  </div>
                  <div className="pt-1">
                    <a
                      href={`${GALILEO_EXPLORER_URL}/address/${agent.developer}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs text-white underline decoration-white/20 decoration-1 underline-offset-2 hover:decoration-modal-green"
                    >
                      view developer on explorer ↗
                    </a>
                  </div>
                </dl>
              )}
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
