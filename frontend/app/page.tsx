"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWalletContext } from "@/lib/contexts/WalletContext";
import { useModelRegistry } from "@/lib/useModelRegistry";
import { useAgentSpaceRegistry } from "@/lib/useAgentSpaceRegistry";
import { ModelCard } from "@/components/hub/ModelCard";
import { SpaceCard } from "@/components/space/SpaceCard";
import { Uploader } from "@/components/Uploader";
import { Package, Link2, Rocket } from "lucide-react";
import { FireflyModel } from "@/components/FireflyModel";
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
      <main className="flex-1 flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-20 md:pb-32 px-6">
          <div className="modal-glow top-[-20%] left-1/2 translate-x-[-50%] w-[800px] h-[600px] opacity-20"></div>

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-8">
              AI infrastructure <br className="hidden md:block" />
              that <span className="text-modal-green italic">developers love</span>
            </h1>
            <p className="text-xl md:text-2xl text-modal-text-dim max-w-3xl mx-auto leading-tight mb-12">
              Run inference, training, batch processing, and sandboxes with 
              sub-second cold starts, instant autoscaling, and 0G Storage.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isConnected ? (
                <>
                  <Link href="/hub/models/new" className="modal-button-primary min-w-[160px]">
                    Get Started
                  </Link>
                  <Link href="/spaces/new" className="modal-button-secondary min-w-[160px]">
                    Deploy Space
                  </Link>
                </>
              ) : (
                <button 
                  onClick={() => {}} // This should trigger wallet connect from Navbar but for simplicity we keep link
                  className="modal-button-primary min-w-[160px]"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>

          {/* Firefly 3D Mascot */}
          <div className="mt-20 flex justify-center">
            <div className="relative w-72 h-72 md:w-96 md:h-96">
              <div className="absolute inset-0 bg-modal-green opacity-15 blur-[100px] rounded-full animate-pulse pointer-events-none" />
              <FireflyModel />
            </div>
          </div>
        </section>

        {/* Featured Models Section (Dark) */}
        <section className="px-6 py-16 md:py-24 bg-black">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-modal-green mb-2 block">
                  Model Registry
                </span>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                  The production cloud for AI.
                </h2>
              </div>
              <Link
                href="/hub"
                className="text-sm font-medium text-modal-text-dim hover:text-white transition-colors"
              >
                Browse All →
              </Link>
            </div>

            {loading ? (
              <div className="grid gap-6 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="modal-card animate-pulse">
                    <div className="h-4 bg-white/5 rounded mb-4 w-1/2"></div>
                    <div className="h-3 bg-white/5 rounded mb-2"></div>
                    <div className="h-3 bg-white/5 rounded w-3/4"></div>
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
              <div className="text-center py-20 border border-dashed border-modal-border rounded-2xl">
                <p className="text-modal-text-dim">
                  No models yet. Be the first to upload!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* How It Works Section (Light Mint) */}
        <section className="modal-section-light py-16 md:py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/40 mb-2 block">
                  Workloads
                </span>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black mb-8 leading-[1.1]">
                  Build full-scale <br className="hidden md:block" /> AI systems.
                </h2>
                <p className="text-lg text-black/70 mb-10 leading-relaxed">
                  From interactive coding agents to long-running RL rollouts, Modal Sandboxes 
                  are the execution layer AI systems need: isolated, flexible, and built to scale.
                </p>
                <Link href="/docs" className="rounded-full px-6 py-2.5 bg-black text-white font-semibold text-sm hover:bg-white/10 transition-all">
                  Learn More
                </Link>
              </div>

              <div className="grid gap-8">
                <div className="flex gap-6 p-6 bg-white/50 rounded-2xl border border-black/5">
                  <div className="mt-1">
                    <Package className="w-8 h-8 text-modal-green" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Upload Model</h3>
                    <p className="text-black/60 text-sm">
                      Upload your AI model weights to 0G Storage. Only the 32-byte Merkle root is stored on-chain.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 p-6 bg-white/50 rounded-2xl border border-black/5">
                  <div className="mt-1">
                    <Link2 className="w-8 h-8 text-modal-green" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Mint on Chain</h3>
                    <p className="text-black/60 text-sm">
                      Register your model on ModelRegistry. Get a unique Agentic ID bound to your storage hash.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 p-6 bg-white/50 rounded-2xl border border-black/5">
                  <div className="mt-1">
                    <Rocket className="w-8 h-8 text-modal-green" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Deploy Space</h3>
                    <p className="text-black/60 text-sm">
                      Launch a live agent space. Auto-deploy to 0G Compute with Gradio, FastAPI, or Express.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Launch / Uploader Section (Dark) */}
        <section className="px-6 py-16 md:py-24 bg-[#0a0a0a] border-t border-modal-border">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-12">
              Ready to ship?
            </h2>
            <div className="modal-card bg-black/50 backdrop-blur-sm">
              <Uploader 
                signer={signer || null} 
                onRequireWallet={handleRequireWallet}
              />
              <div className="mt-8 text-sm text-modal-text-dim flex justify-center gap-8 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-modal-green">✓</span> No commitments
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-modal-green">✓</span> Pay only for storage
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-modal-green">✓</span> Instant deployment
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-black border-t border-modal-border px-6 py-12">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-4 mb-8 md:mb-0">
            <Image src="/logo.png" alt="Logo" width={24} height={24} className="opacity-50" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-modal-text-dim">
              built on 0g modular infrastructure
            </p>
          </div>
          <div className="flex gap-8">
            <Link href="/hub" className="text-sm text-modal-text-dim hover:text-white transition-colors">
              Models
            </Link>
            <Link href="/spaces" className="text-sm text-modal-text-dim hover:text-white transition-colors">
              Spaces
            </Link>
            <Link href="/playground" className="text-sm text-modal-text-dim hover:text-white transition-colors">
              Playground
            </Link>
            <Link href="/docs" className="text-sm text-modal-text-dim hover:text-white transition-colors">
              Docs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
  }