"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Sparkles, ArrowLeft } from "lucide-react";
import ErrorBlob from "@/components/ErrorBlob";
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
    <div className="flex flex-col min-h-full">
      <main className="flex-1 flex-col">
        {/* Hero Section */}
        <section className="px-6 py-24">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-baseline justify-between mb-12">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-modal-green mb-2 block">
                  Model Registry
                </span>
                <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                  COREED HUB
                </h1>
                <p className="text-modal-text-dim">
                  Discover and deploy AI models on 0G. {totalModels} models registered.
                </p>
              </div>
              <Link
                href="/"
                className="modal-button-secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Launch Agent
              </Link>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-12 flex-wrap">
              <Link
                href="/hub"
                className="modal-button-primary text-xs px-5 py-1.5"
              >
                Overview
              </Link>
              <Link
                href="/hub/search"
                className="modal-button-secondary text-xs px-5 py-1.5"
              >
                Browse All
              </Link>
              {isConnected && address && (
                <Link
                  href="/hub/my-models"
                  className="modal-button-secondary text-xs px-5 py-1.5"
                >
                  My Models
                </Link>
              )}
              <Link
                href="/spaces"
                className="modal-button-secondary text-xs px-5 py-1.5"
              >
                Spaces
              </Link>
            </div>

            <ErrorBlob error={error} />
          </div>
        </section>

        {/* Trending Models Section */}
        <section className="px-6 py-24 bg-black">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <p className="text-modal-text-dim animate-pulse">Loading models...</p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-4xl font-bold tracking-tight text-white">
                    <Flame className="inline-block w-6 h-6 mr-2 -mt-1 text-modal-green" /> Trending Models
                  </h2>
                  <Link
                    href="/hub/search?sort=popular"
                    className="text-sm font-medium text-modal-text-dim hover:text-white transition-colors"
                  >
                    View All →
                  </Link>
                </div>
                {trendingModels.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-modal-border rounded-2xl">
                    <p className="text-modal-text-dim">
                      No models yet. Be the first to upload!
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {trendingModels.map((model) => (
                      <ModelCard key={model.modelId} model={model} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Recently Added Section */}
        <section className="px-6 py-24 bg-[#0a0a0a] border-t border-modal-border">
          <div className="max-w-6xl mx-auto">
            {!loading && (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-4xl font-bold tracking-tight text-white">
                    <Sparkles className="inline-block w-6 h-6 mr-2 -mt-1 text-modal-green" /> Recently Added
                  </h2>
                  <Link
                    href="/hub/search?sort=recent"
                    className="text-sm font-medium text-modal-text-dim hover:text-white transition-colors"
                  >
                    View All →
                  </Link>
                </div>
                {recentModels.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-modal-border rounded-2xl">
                    <p className="text-modal-text-dim">
                      No recent models.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {recentModels.map((model) => (
                      <ModelCard key={model.modelId} model={model} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
