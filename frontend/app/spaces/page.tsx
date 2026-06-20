"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SpaceCard } from "@/components/space/SpaceCard";
import { useAgentSpaceRegistry } from "@/lib/useAgentSpaceRegistry";
import { useWalletContext } from "@/lib/contexts/WalletContext";
import type { AgentSpace } from "@/types/space";

export default function SpacesPage() {
  const { address, isConnected } = useWalletContext();
  const [spaces, setSpaces] = useState<AgentSpace[]>([]);
  const [activeSpaces, setActiveSpaces] = useState<AgentSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { getAllSpaces, getActiveSpaces, error } = useAgentSpaceRegistry();

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        setLoading(true);
        const allSpaces = await getAllSpaces();
        const active = await getActiveSpaces();
        setSpaces(allSpaces);
        setActiveSpaces(active);
      } catch (err) {
        console.error("Failed to fetch spaces:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpaces();
  }, [getAllSpaces, getActiveSpaces]);

  const filteredSpaces = spaces.filter((space) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return space.isActive && !space.isAsleep;
    if (statusFilter === "inactive") return !space.isActive || space.isAsleep;
    if (statusFilter === "asleep") return space.isAsleep;
    return true;
  });

  const mySpaces = filteredSpaces.filter((space) => space.owner?.toLowerCase() === address?.toLowerCase());
  const otherSpaces = filteredSpaces.filter((space) => space.owner?.toLowerCase() !== address?.toLowerCase());

  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-coreed-moss-bright to-coreed-clay bg-clip-text text-transparent mb-2">
          AGENT SPACES
        </h1>
        <p className="text-coreed-sage">
          {spaces.length} spaces deployed on Coreed
        </p>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <Link
          href="/spaces"
          className="px-4 py-2 bg-coreed-moss/20 text-coreed-bone rounded-md text-sm font-medium"
        >
          All Spaces
        </Link>
        <button
          onClick={() => setStatusFilter("active")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            statusFilter === "active"
              ? "bg-coreed-moss/20 text-coreed-bone"
              : "text-coreed-sage hover:bg-coreed-panel-raised"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setStatusFilter("inactive")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            statusFilter === "inactive"
              ? "bg-coreed-moss/20 text-coreed-bone"
              : "text-coreed-sage hover:bg-coreed-panel-raised"
          }`}
        >
          Inactive
        </button>
        <button
          onClick={() => setStatusFilter("asleep")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            statusFilter === "asleep"
              ? "bg-coreed-moss/20 text-coreed-bone"
              : "text-coreed-sage hover:bg-coreed-panel-raised"
          }`}
        >
          Asleep
        </button>
        {isConnected && (
          <Link
            href="/spaces/new"
            className="px-4 py-2 text-coreed-sage hover:bg-coreed-panel-raised rounded-md text-sm transition-colors"
          >
            + Deploy Space
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded border border-coreed-clay bg-coreed-panel-raised p-4">
          <p className="font-mono text-sm text-coreed-clay" role="alert">
            {error}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <p className="text-coreed-sage coreed-pulse">Loading spaces...</p>
        </div>
      ) : (
        <>
          {filteredSpaces.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-xl text-coreed-sage/70 mb-2">
                  No spaces found
                </p>
                <p className="text-coreed-sage/50 text-sm">
                  {isConnected 
                    ? "Be the first to deploy a space!" 
                    : "Connect your wallet to deploy spaces"}
                </p>
                {isConnected && (
                  <Link
                    href="/spaces/new"
                    className="inline-block mt-4 px-4 py-2 bg-coreed-moss hover:bg-coreed-moss-bright text-coreed-void rounded-md text-sm transition-colors"
                  >
                    Deploy Space
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* My Spaces Section */}
              {mySpaces.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-xl font-semibold text-coreed-bone mb-6">
                    My Spaces ({mySpaces.length})
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {mySpaces.map((space) => (
                      <SpaceCard key={space.spaceId} deployment={{ space, model: { modelId: space.modelId.toString(), name: "Unknown", storageRootHash: "" }, healthStatus: { isActive: space.isActive, lastChecked: space.lastHealthCheck } }} signer={null} showSleepStatus />
                    ))}
                  </div>
                </section>
              )}

              {/* All Spaces Section */}
              <section>
                <h2 className="text-xl font-semibold text-coreed-bone mb-6">
                  All Spaces ({otherSpaces.length})
                </h2>
                {otherSpaces.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {otherSpaces.map((space) => (
                      <SpaceCard key={space.spaceId} deployment={{ space, model: { modelId: space.modelId.toString(), name: "Unknown", storageRootHash: "" }, healthStatus: { isActive: space.isActive, lastChecked: space.lastHealthCheck } }} signer={null} showSleepStatus />
                    ))}
                  </div>
                ) : (
                  <p className="text-coreed-sage/50 text-sm text-center py-8">
                    No other spaces found
                  </p>
                )}
              </section>

              {/* Stats */}
              <div className="mt-8 pt-6 border-t border-coreed-line/30 flex flex-wrap gap-6 text-sm text-coreed-sage">
                <div>
                  <span className="text-coreed-bone/70">Active: </span>
                  {activeSpaces.length}
                </div>
                <div>
                  <span className="text-coreed-bone/70">Total: </span>
                  {spaces.length}
                </div>
                {mySpaces.length > 0 && (
                  <div>
                    <span className="text-coreed-bone/70">Mine: </span>
                    {mySpaces.length}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}