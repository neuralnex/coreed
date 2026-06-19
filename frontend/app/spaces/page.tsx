"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusStrip } from "@/components/StatusStrip";
import { useAgentSpaceRegistry } from "@/lib/useAgentSpaceRegistry";
import { useModelRegistry } from "@/lib/useModelRegistry";
import { SpaceCard } from "@/components/space/SpaceCard";
import type { AgentSpace, SpaceDeployment } from "@/types/space";
import type { JsonRpcSigner } from "ethers";

export default function SpacesPage() {
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<SpaceDeployment[]>([]);
  const [activeSpaces, setActiveSpaces] = useState<AgentSpace[]>([]);
  const [totalSpaces, setTotalSpaces] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const { getActiveSpaces, getTotalSpaces, error: spaceError } = useAgentSpaceRegistry();
  const { getModel, error: modelError } = useModelRegistry();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get active spaces
        const active = await getActiveSpaces();
        setActiveSpaces(active);
        
        // Get total spaces count
        const total = await getTotalSpaces();
        setTotalSpaces(total);
        
        // Enrich spaces with model data
        const enriched = await Promise.all(
          active.map(async (space) => {
            try {
              const model = await getModel(space.modelId);
              return {
                space,
                model: {
                  modelId: model.modelId,
                  name: model.name,
                  storageRootHash: model.storageRootHash
                },
                healthStatus: {
                  isActive: space.isActive,
                  lastChecked: space.lastHealthCheck
                }
              };
            } catch {
              return {
                space,
                model: {
                  modelId: space.modelId,
                  name: "Unknown Model",
                  storageRootHash: ""
                },
                healthStatus: {
                  isActive: space.isActive,
                  lastChecked: space.lastHealthCheck
                }
              };
            }
          })
        );
        setSpaces(enriched);
        
      } catch (err) {
        console.error("Failed to fetch spaces:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getActiveSpaces, getTotalSpaces, getModel]);

  return (
    <>
      <StatusStrip
        address={address}
        onConnect={(s, addr) => {
          setSigner(s);
          setAddress(addr);
        }}
      />

      <main className="mx-auto flex max-w-6xl flex-1 flex-col px-6 py-12">
        <div className="mb-8">
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="font-mono text-2xl font-medium tracking-tight text-coreed-bone">
                agent spaces
              </h1>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-coreed-sage">
                Deploy and manage live AI agents. {totalSpaces} spaces registered, {activeSpaces.length} active.
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/hub"
                className="font-mono text-xs text-coreed-sage hover:text-coreed-bone"
              >
                ← model hub
              </Link>
              {address && (
                <Link
                  href="/spaces/new"
                  className="rounded border border-coreed-moss bg-coreed-panel-raised px-3 py-1.5 font-mono text-xs text-coreed-bone hover:border-coreed-moss-bright"
                >
                  + New Space
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Link
            href="/spaces"
            className="rounded border border-coreed-moss bg-coreed-panel-raised px-3 py-1.5 font-mono text-xs text-coreed-bone"
          >
            All Spaces
          </Link>
          <Link
            href="/spaces?filter=active"
            className="rounded border border-coreed-line px-3 py-1.5 font-mono text-xs text-coreed-sage hover:border-coreed-moss hover:text-coreed-bone"
          >
            Active Only
          </Link>
          {address && (
            <Link
              href="/spaces?filter=mine"
              className="rounded border border-coreed-line px-3 py-1.5 font-mono text-xs text-coreed-sage hover:border-coreed-moss hover:text-coreed-bone"
            >
              My Spaces
            </Link>
          )}
        </div>

        {spaceError || modelError ? (
          <div className="mb-6 rounded border border-coreed-clay bg-coreed-panel-raised p-4">
            <p className="font-mono text-xs text-coreed-clay" role="alert">
              {spaceError || modelError}
            </p>
          </div>
        ) : null}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-mono text-coreed-sage coreed-pulse">Loading agent spaces...</p>
          </div>
        ) : spaces.length === 0 ? (
          <div className="flex-1 flex items-center justify-center rounded border border-coreed-line bg-coreed-panel p-12">
            <div className="text-center">
              <p className="font-mono text-coreed-sage mb-4">
                No agent spaces deployed yet.
              </p>
              {address ? (
                <Link
                  href="/spaces/new"
                  className="inline-block rounded border border-coreed-moss px-4 py-2 font-mono text-xs text-coreed-bone hover:bg-coreed-panel-raised"
                >
                  Deploy Your First Space →
                </Link>
              ) : (
                <p className="font-mono text-xs text-coreed-sage/70">
                  Connect your wallet to deploy a space
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {spaces.map((deployment) => (
              <SpaceCard
                key={deployment.space.spaceId}
                deployment={deployment}
                signer={signer}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
