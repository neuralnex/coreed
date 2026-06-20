"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ModelCard } from "@/components/hub/ModelCard";
import { useModelRegistry } from "@/lib/useModelRegistry";
import { useWalletContext } from "@/lib/contexts/WalletContext";
import type { ModelMeta } from "@/types/model";

export default function HubPage() {
  const { address, isConnected } = useWalletContext();
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
    <main className="mx-auto flex max-w-6xl flex-1 flex-col px-6 py-12">
        <div className="mb-8">
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-coreed-moss-bright to-coreed-clay bg-clip-text text-transparent mb-2">
                COREED HUB
              </h1>
              <p className="text-coreed-sage">
                Discover and deploy AI models on 0G. {totalModels} models registered.
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-coreed-panel-raised border border-coreed-line/30 rounded-md text-sm text-coreed-bone hover:border-coreed-moss-bright transition-colors"
            >
              ← Launch Agent
            </Link>
          </div>
        </div>

        <div className="flex gap-2 mb-8 flex-wrap">
          <Link
            href="/hub"
            className="px-4 py-2 bg-coreed-moss/20 text-coreed-bone rounded-md text-sm font-medium"
          >
            Overview
          </Link>
          <Link
            href="/hub/search"
            className="px-4 py-2 text-coreed-sage hover:bg-coreed-panel-raised rounded-md text-sm transition-colors"
          >
            Browse All
          </Link>
          {isConnected && address && (
            <Link
              href="/hub/my-models"
              className="px-4 py-2 text-coreed-sage hover:bg-coreed-panel-raised rounded-md text-sm transition-colors"
            >
              My Models
            </Link>
          )}
          <Link
            href="/spaces"
            className="px-4 py-2 text-coreed-sage hover:bg-coreed-panel-raised rounded-md text-sm transition-colors"
          >
            Spaces
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
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-coreed-bone">
                  🔥 Trending Models
                </h2>
                <Link
                  href="/hub/search?sort=popular"
                  className="text-sm text-coreed-moss-bright hover:text-coreed-bone transition-colors"
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
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-coreed-bone">
                  🆕 Recently Added
                </h2>
                <Link
                  href="/hub/search?sort=recent"
                  className="text-sm text-coreed-moss-bright hover:text-coreed-bone transition-colors"
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
  );
}
