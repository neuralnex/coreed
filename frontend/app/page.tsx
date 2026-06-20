"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useWalletContext } from "@/lib/contexts/WalletContext";
import { useModelRegistry } from "@/lib/useModelRegistry";
import { useAgentSpaceRegistry } from "@/lib/useAgentSpaceRegistry";
import { ModelCard } from "@/components/hub/ModelCard";
import { SpaceCard } from "@/components/space/SpaceCard";
import { Uploader } from "@/components/Uploader";
import type { ModelMeta } from "@/types/model";
import type { AgentSpace } from "@/types/space";

export default function Home() {
  const { signer, isConnected } = useWalletContext();
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);
  const [recentModels, setRecentModels] = useState<ModelMeta[]>([]);
  const [recentSpaces, setRecentSpaces] = useState<AgentSpace[]>([]);
  const [loading, setLoading] = useState(true);

  const { searchModels } = useModelRegistry();
  const { getActiveSpaces } = useAgentSpaceRegistry();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch recent models
        const modelsResult = await searchModels({
          sortBy: "recent",
          sortOrder: "desc"
        });
        setRecentModels(modelsResult.models.slice(0, 3));

        // Fetch active spaces
        const activeSpaces = await getActiveSpaces();
        setRecentSpaces(activeSpaces.slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch landing page data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchModels, getActiveSpaces]);

  const handleRequireWallet = useCallback(() => {
    if (!isConnected) {
      setShowConnectPrompt(true);
    }
  }, [isConnected]);

  return (
    <div className="flex flex-col min-h-full">
      <main className="mx-auto flex max-w-6xl flex-1 flex-col">
        {/* Hero Section */}
        <section className="text-center py-16 px-6">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-coreed-moss-bright to-coreed-clay bg-clip-text text-transparent mb-6">
            Coreed
          </h1>
          <p className="text-xl md:text-2xl text-coreed-sage max-w-3xl mx-auto leading-relaxed">
            Deploy and discover AI agents on 0G Chain
          </p>
          <p className="text-lg text-coreed-sage/70 mt-4 max-w-2xl mx-auto">
            Route model payloads to 0G Storage, mint Agentic IDs on-chain, and deploy live spaces
          </p>
          
          <div className="flex gap-4 justify-center mt-8">
            {isConnected ? (
              <>
                <Link
                  href="/hub/models/new"
                  className="px-6 py-3 bg-coreed-moss hover:bg-coreed-moss-bright text-coreed-void rounded-md font-medium transition-colors"
                >
                  Upload Model
                </Link>
                <Link
                  href="/spaces/new"
                  className="px-6 py-3 bg-coreed-panel-raised border border-coreed-line/30 text-coreed-bone rounded-md font-medium hover:border-coreed-moss-bright transition-colors"
                >
                  Deploy Space
                </Link>
              </>
            ) : (
              <p className="text-coreed-sage/60">
                Connect your wallet to get started
              </p>
            )}
          </div>
        </section>

        {showConnectPrompt && !isConnected && (
          <div className="mx-6 mb-8 p-4 bg-coreed-panel-raised border border-coreed-clay/20 rounded-lg text-center">
            <p className="text-coreed-clay">
              Connect your wallet to launch an agent
            </p>
          </div>
        )}

        {/* Quick Launch Section */}
        <section className="px-6 py-12">
          <div className="bg-coreed-panel-raised border border-coreed-line/30 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-coreed-bone mb-6">
              Quick Launch
            </h2>
            <div className="max-w-2xl mx-auto">
              <Uploader 
                signer={signer || null} 
                onRequireWallet={handleRequireWallet}
              />
              <div className="mt-4 text-center">
                <p className="text-sm text-coreed-sage/70">
                  Drag & drop your model file to get started instantly
                </p>
                <p className="text-xs text-coreed-sage/50 mt-2">
                  Only the 32-byte Merkle root crosses onto 0G Chain
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Models Section */}
        <section className="px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-coreed-bone">
              Featured Models
            </h2>
            <Link
              href="/hub"
              className="text-coreed-moss-bright hover:text-coreed-bone transition-colors"
            >
              Browse All Models →
            </Link>
          </div>
          
          {loading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded border border-coreed-line bg-coreed-panel p-6 animate-pulse">
                  <div className="h-4 bg-coreed-line/30 rounded mb-4"></div>
                  <div className="h-3 bg-coreed-line/20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-coreed-line/20 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentModels.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {recentModels.map((model) => (
                <ModelCard key={model.modelId} model={model} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-coreed-sage/50">
                No models yet. Be the first to upload!
              </p>
            </div>
          )}
        </section>

        {/* Active Spaces Section */}
        <section className="px-6 py-12 border-t border-coreed-line/30">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-coreed-bone">
              Active Spaces
            </h2>
            <Link
              href="/spaces"
              className="text-coreed-moss-bright hover:text-coreed-bone transition-colors"
            >
              Browse All Spaces →
            </Link>
          </div>
          
          {loading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded border border-coreed-line bg-coreed-panel p-6 animate-pulse">
                  <div className="h-4 bg-coreed-line/30 rounded mb-4"></div>
                  <div className="h-3 bg-coreed-line/20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-coreed-line/20 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentSpaces.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {recentSpaces.map((space) => (
                <SpaceCard 
                  key={space.spaceId} 
                  deployment={{
                    space, 
                    model: { modelId: space.modelId.toString(), name: "Model", storageRootHash: "" },
                    healthStatus: { isActive: space.isActive, lastChecked: space.lastHealthCheck }
                  }} 
                  signer={null} 
                  showSleepStatus
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-coreed-sage/50">
                No active spaces. Deploy the first one!
              </p>
            </div>
          )}
        </section>

        {/* How It Works Section */}
        <section className="px-6 py-16 border-t border-coreed-line/30">
          <h2 className="text-2xl font-semibold text-coreed-bone mb-12 text-center">
            How Coreed Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-coreed-bone mb-3">
                Upload Model
              </h3>
              <p className="text-coreed-sage/70">
                Upload your AI model weights to 0G Storage. Only the 32-byte Merkle root is stored on-chain.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="text-4xl mb-4">⛓️</div>
              <h3 className="text-xl font-semibold text-coreed-bone mb-3">
                Mint on Chain
              </h3>
              <p className="text-coreed-sage/70">
                Register your model on ModelRegistry. Get a unique Agentic ID bound to your storage hash.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-coreed-bone mb-3">
                Deploy Space
              </h3>
              <p className="text-coreed-sage/70">
                Launch a live agent space. Auto-deploy to 0G Compute with Gradio, FastAPI, or Express templates.
              </p>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="px-6 py-12 border-t border-coreed-line/30">
          <div className="flex flex-wrap gap-8 justify-center text-center">
            <div className="p-6 bg-coreed-panel-raised border border-coreed-line/30 rounded-lg min-w-[200px]">
              <div className="text-3xl font-bold text-coreed-moss-bright">{recentModels.length}+</div>
              <div className="text-coreed-sage mt-2">Models Registered</div>
            </div>
            <div className="p-6 bg-coreed-panel-raised border border-coreed-line/30 rounded-lg min-w-[200px]">
              <div className="text-3xl font-bold text-coreed-moss-bright">{recentSpaces.length}+</div>
              <div className="text-coreed-sage mt-2">Active Spaces</div>
            </div>
            <div className="p-6 bg-coreed-panel-raised border border-coreed-line/30 rounded-lg min-w-[200px]">
              <div className="text-3xl font-bold text-coreed-moss-bright">4</div>
              <div className="text-coreed-sage mt-2">Templates Available</div>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-coreed-line px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center">
          <p className="font-mono text-[11px] text-coreed-sage/70">
            built on 0g modular infrastructure — storage · chain · compute
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/hub" className="text-coreed-sage/70 hover:text-coreed-bone text-sm transition-colors">
              Models
            </Link>
            <Link href="/spaces" className="text-coreed-sage/70 hover:text-coreed-bone text-sm transition-colors">
              Spaces
            </Link>
            <Link href="/playground" className="text-coreed-sage/70 hover:text-coreed-bone text-sm transition-colors">
              Playground
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}