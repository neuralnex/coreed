"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusStrip } from "@/components/StatusStrip";
import { ModelCard } from "@/components/hub/ModelCard";
import { useModelRegistry } from "@/lib/useModelRegistry";
import type { ModelMeta } from "@/types/model";
import type { JsonRpcSigner } from "ethers";

export default function HubPage() {
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [trendingModels, setTrendingModels] = useState<ModelMeta[]>([]);
  const [recentModels, setRecentModels] = useState<ModelMeta[]>([]);
  const [totalModels, setTotalModels] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const { getTrendingModels, getTotalModels, searchModels, error } = useModelRegistry();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [trending, recent, total] = await Promise.all([
          getTrendingModels(6),
          searchModels({ sortBy: "recent", sortOrder: "desc" }),
          getTotalModels()
        ]);
        setTrendingModels(trending);
        setRecentModels(recent.models.slice(0, 6));
        setTotalModels(total);
      } catch (err) {
        console.error("Failed to fetch hub data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getTrendingModels, getTotalModels, searchModels]);

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
                coreed hub
              </h1>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-coreed-sage">
                Discover and deploy AI models on 0G. {totalModels} models registered.
              </p>
            </div>
            <Link
              href="/"
              className="font-mono text-xs text-coreed-sage hover:text-coreed-bone"
            >
              ← launch
            </Link>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Link
            href="/hub"
            className="rounded border border-coreed-moss bg-coreed-panel-raised px-3 py-1.5 font-mono text-xs text-coreed-bone"
          >
            Overview
          </Link>
          <Link
            href="/hub/search"
            className="rounded border border-coreed-line px-3 py-1.5 font-mono text-xs text-coreed-sage hover:border-coreed-moss hover:text-coreed-bone"
          >
            Browse All
          </Link>
          {address && (
            <Link
              href="/hub/my-models"
              className="rounded border border-coreed-line px-3 py-1.5 font-mono text-xs text-coreed-sage hover:border-coreed-moss hover:text-coreed-bone"
            >
              My Models
            </Link>
          )}
          <Link
            href="/playground"
            className="rounded border border-coreed-line px-3 py-1.5 font-mono text-xs text-coreed-sage hover:border-coreed-moss hover:text-coreed-bone"
          >
            Agents
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded border border-coreed-clay bg-coreed-panel-raised p-4">
            <p className="font-mono text-xs text-coreed-clay" role="alert">
              {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-mono text-coreed-sage coreed-pulse">Loading models...</p>
          </div>
        ) : (
          <>
            <section className="mb-12">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-mono text-lg font-medium text-coreed-bone">
                  🔥 Trending Models
                </h2>
                <Link
                  href="/hub/search?sort=popular"
                  className="font-mono text-xs text-coreed-moss-bright hover:text-coreed-bone"
                >
                  View All →
                </Link>
              </div>
              {trendingModels.length === 0 ? (
                <p className="font-mono text-xs text-coreed-sage">
                  No models yet. Be the first to upload!
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {trendingModels.map((model) => (
                    <ModelCard key={model.modelId} model={model} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-mono text-lg font-medium text-coreed-bone">
                  🆕 Recently Added
                </h2>
                <Link
                  href="/hub/search?sort=recent"
                  className="font-mono text-xs text-coreed-moss-bright hover:text-coreed-bone"
                >
                  View All →
                </Link>
              </div>
              {recentModels.length === 0 ? (
                <p className="font-mono text-xs text-coreed-sage">
                  No recent models.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {recentModels.map((model) => (
                    <ModelCard key={model.modelId} model={model} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
