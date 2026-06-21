"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ErrorBlob from "@/components/ErrorBlob";
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
    <div className="flex flex-col min-h-full">
      <main className="flex-1 flex-col">
        {/* Hero Section */}
        <section className="px-6 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-modal-green mb-2 block">
                Agent Registry
              </span>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
                Agent Spaces
              </h1>
              <p className="text-modal-text-dim text-sm">
                {spaces.length} active agent environments deployed on Modal
              </p>
            </div>

            {/* Filter Navigation */}
            <div className="flex gap-3 mb-12 flex-wrap items-center">
              <button
                onClick={() => setStatusFilter("all")}
                className={statusFilter === "all" ? "modal-button-primary" : "modal-button-secondary"}
              >
                All Spaces
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={statusFilter === "active" ? "modal-button-primary" : "modal-button-secondary"}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("inactive")}
                className={statusFilter === "inactive" ? "modal-button-primary" : "modal-button-secondary"}
              >
                Inactive
              </button>
              <button
                onClick={() => setStatusFilter("asleep")}
                className={statusFilter === "asleep" ? "modal-button-primary" : "modal-button-secondary"}
              >
                Asleep
              </button>
              {isConnected && (
                <Link
                  href="/spaces/new"
                  className="modal-button-secondary"
                >
                  + Deploy Space
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Spaces Content Section */}
        <section className="px-6 py-16 md:py-24 bg-black border-t border-modal-border">
          <div className="max-w-6xl mx-auto">
            <ErrorBlob error={error} />

            {loading ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <p className="text-modal-text-dim animate-pulse">Loading spaces...</p>
              </div>
            ) : (
              <>
                {filteredSpaces.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center py-20 border border-dashed border-modal-border rounded-2xl">
                    <div className="text-center">
                      <p className="text-lg text-modal-text-dim mb-4">
                        No spaces found
                      </p>
                      {isConnected && (
                        <Link
                          href="/spaces/new"
                          className="modal-button-primary text-xs px-6 py-2"
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
                      <section className="mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6 md:mb-8">
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
                      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6 md:mb-8">
                        All Spaces ({otherSpaces.length})
                      </h2>
                      {otherSpaces.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {otherSpaces.map((space) => (
                            <SpaceCard key={space.spaceId} deployment={{ space, model: { modelId: space.spaceId.toString(), name: "Unknown", storageRootHash: "" }, healthStatus: { isActive: space.isActive, lastChecked: space.lastHealthCheck } }} signer={null} showSleepStatus />
                          ))}
                        </div>
                      ) : (
                        <p className="text-modal-text-dim text-sm text-center py-8">
                          No other spaces found
                        </p>
                      )}
                    </section>

                    {/* Stats */}
                    <div className="mt-16 pt-6 border-t border-modal-border flex flex-wrap gap-6 text-xs font-mono text-modal-text-dim">
                      <div>
                        <span className="text-white/60">Active: </span>
                        {activeSpaces.length}
                      </div>
                      <div>
                        <span className="text-white/60">Total: </span>
                        {spaces.length}
                      </div>
                      {mySpaces.length > 0 && (
                        <div>
                          <span className="text-white/60">Mine: </span>
                          {mySpaces.length}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
