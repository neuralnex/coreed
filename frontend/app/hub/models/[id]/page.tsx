"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Heart, Download, Rocket, Package } from "lucide-react";
import { useWalletContext } from "@/lib/contexts/WalletContext";
import { useModelRegistry } from "@/lib/useModelRegistry";
import { useAgentRegistry } from "@/lib/useAgentRegistry";
import { GALILEO_EXPLORER_URL } from "@/lib/wallet";
import type { ModelMeta } from "@/types/model";

export default function ModelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const modelId = params.id as string;
  const { address, isConnected, signer } = useWalletContext();
  
  const [model, setModel] = useState<ModelMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isCreator, setIsCreator] = useState(false);
  const [deploying, setDeploying] = useState(false);

  const { getModel, likeModel, unlikeModel, checkLike, recordDownload, error } = useModelRegistry();
  const { launchAgent } = useAgentRegistry();

  const fetchModel = useCallback(async () => {
    try {
      setLoading(true);
      const modelData = await getModel(modelId);
      setModel(modelData);
      setLikeCount(Number(modelData.likeCount));
      
      if (address) {
        const hasLiked = await checkLike(modelId, address);
        setLiked(hasLiked);
      }
      
      if (modelData.creator.toLowerCase() === address?.toLowerCase()) {
        setIsCreator(true);
      }
    } catch (err) {
      console.error("Failed to fetch model:", err);
      router.push("/hub/search");
    } finally {
      setLoading(false);
    }
  }, [modelId, address, getModel, checkLike, router]);

  useEffect(() => {
    fetchModel();
  }, [fetchModel]);

  useEffect(() => {
    if (address) {
      checkLike(modelId, address).then(setLiked);
      fetchModel();
    }
  }, [address, modelId, checkLike, fetchModel]);

  const handleLike = async () => {
    if (!signer || !model) return;
    
    try {
      if (liked) {
        await unlikeModel(modelId, signer);
        setLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await likeModel(modelId, signer);
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const handleDownload = async () => {
    if (!signer || !model) return;
    
    try {
      await recordDownload(modelId);
      // Increment download count locally for immediate feedback
      // Note: In production, you'd want to refetch or listen for events
    } catch (err) {
      console.error("Failed to record download:", err);
    }
  };

  const handleDeploy = async () => {
    if (!signer || !model) return;
    
    setDeploying(true);
    try {
      await launchAgent(signer, model.name, model.storageRootHash);
      // Redirect to spaces or show success message
      router.push("/spaces/new");
    } catch (err) {
      console.error("Failed to deploy:", err);
    } finally {
      setDeploying(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto flex max-w-6xl flex-1 flex-col px-6 py-12">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-coreed-sage coreed-pulse">Loading model details...</p>
        </div>
      </main>
    );
  }

  if (!model) {
    return (
      <main className="mx-auto flex max-w-6xl flex-1 flex-col px-6 py-12">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-coreed-sage/70 mb-2">
              Model not found
            </p>
            <Link
              href="/hub"
              className="px-4 py-2 bg-coreed-moss hover:bg-coreed-moss-bright text-coreed-void rounded-md text-sm transition-colors"
            >
              Back to Hub
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-1 flex-col px-6 py-12">
      <div className="mb-8">
        <div className="flex gap-2 mb-4">
          <Link
            href="/hub"
            className="px-4 py-2 text-coreed-sage hover:bg-coreed-panel-raised rounded-md text-sm transition-colors"
          >
            ← Back to Hub
          </Link>
          {isCreator && (
            <Link
              href={`/hub/models/${model.modelId}/edit`}
              className="px-4 py-2 text-coreed-sage hover:bg-coreed-panel-raised rounded-md text-sm transition-colors"
            >
              Edit
            </Link>
          )}
        </div>

        {/* Model Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-coreed-moss-bright to-coreed-clay bg-clip-text text-transparent mb-4">
            {model.name}
          </h1>
          <div className="flex flex-wrap gap-4 items-center mb-4">
            {model.architecture && (
              <span className="px-3 py-1 bg-coreed-moss/10 text-coreed-moss-bright text-xs rounded-full border border-coreed-moss/20">
                {model.architecture}
              </span>
            )}
            {model.parameters && (
              <span className="px-3 py-1 bg-coreed-panel-raised border border-coreed-line/30 text-coreed-bone/70 text-xs rounded-full">
                {model.parameters.toLocaleString()} Parameters
              </span>
            )}
            <span className="px-3 py-1 bg-coreed-panel-raised border border-coreed-line/30 text-coreed-bone/70 text-xs rounded-full">
              {model.license}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleLike}
              disabled={!isConnected}
              className={`px-4 py-3 rounded-md text-sm font-medium transition-colors touch-manipulation active:scale-[0.98] min-h-[44px] ${
                liked
                  ? "bg-coreed-moss text-coreed-void"
                  : "bg-coreed-panel-raised border border-coreed-line/30 text-coreed-bone hover:border-coreed-moss"
              }`}
            >
              <Heart className="inline-block w-4 h-4 mr-1 -mt-0.5" /> {likeCount} {likeCount === 1 ? "like" : "likes"}
            </button>
            <button
              onClick={handleDownload}
              disabled={!isConnected}
              className="px-4 py-3 bg-coreed-panel-raised border border-coreed-line/30 text-coreed-bone rounded-md text-sm font-medium hover:border-coreed-moss transition-colors touch-manipulation active:scale-[0.98] min-h-[44px]"
            >
              <Download className="w-4 h-4" /> Download
            </button>
            {isConnected && (
              <button
                onClick={handleDeploy}
                disabled={deploying}
                className="px-4 py-3 bg-coreed-moss hover:bg-coreed-moss-bright disabled:bg-coreed-line disabled:cursor-not-allowed text-coreed-void rounded-md text-sm font-medium transition-colors touch-manipulation active:scale-[0.98] min-h-[44px]"
              >
                {deploying ? "Deploying..." : <><Rocket className="inline-block w-4 h-4 mr-1 -mt-0.5" /> Deploy Space</>}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded border border-coreed-clay bg-coreed-panel-raised p-4">
            <p className="text-sm text-coreed-clay" role="alert">
              {error}
            </p>
          </div>
        )}

        {/* Model Details */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Description */}
          <div className="md:col-span-2">
            <h2 className="text-lg font-semibold text-coreed-bone mb-4">
              Description
            </h2>
            <p className="text-coreed-sage leading-relaxed">
              {model.description || "No description provided."}
            </p>
          </div>

          {/* Metadata */}
          <div>
            <h2 className="text-lg font-semibold text-coreed-bone mb-4">
              Metadata
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-coreed-sage/70 mb-1">Model ID</p>
                <p className="text-sm text-coreed-bone font-mono">{model.modelId}</p>
              </div>
              <div>
                <p className="text-sm text-coreed-sage/70 mb-1">Creator</p>
                <p className="text-sm text-coreed-bone font-mono truncate">{model.creator}</p>
              </div>
              <div>
                <p className="text-sm text-coreed-sage/70 mb-1">Created</p>
                <p className="text-sm text-coreed-bone">
                  {new Date(Number(model.createdAt) * 1000).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-coreed-sage/70 mb-1">Storage Hash</p>
                <p className="text-sm text-coreed-bone font-mono truncate">{model.storageRootHash}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        {model.tags && model.tags.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-coreed-bone mb-4">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {model.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-coreed-panel-raised border border-coreed-line/30 text-coreed-sage text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Storage Info */}
        <div className="bg-coreed-panel-raised border border-coreed-line/30 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-coreed-bone mb-4">
            Storage Information
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-coreed-moss/10 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-coreed-moss-bright" />
            </div>
            <div>
              <p className="text-sm text-coreed-bone/70">Storage Root Hash</p>
              <p className="text-coreed-bone font-mono">{model.storageRootHash}</p>
            </div>
          </div>
          <Link
            href={`${GALILEO_EXPLORER_URL}/address/${model.storageRootHash}`}
            target="_blank"
            className="inline-block mt-4 px-4 py-2 bg-coreed-panel border border-coreed-line/30 text-coreed-sage text-sm rounded-md hover:border-coreed-moss transition-colors"
          >
            View on Explorer →
          </Link>
        </div>

        {/* Downloads and Likes */}
        <div className="grid md:grid-cols-2 gap-6 border-t border-coreed-line/30 pt-8">
          <div className="p-6 bg-coreed-panel-raised border border-coreed-line/30 rounded-lg text-center">
            <div className="text-3xl font-bold text-coreed-moss-bright mb-2">
              {model.downloadCount}
            </div>
            <div className="text-coreed-sage">
              Total Downloads
            </div>
          </div>
          <div className="p-6 bg-coreed-panel-raised border border-coreed-line/30 rounded-lg text-center">
            <div className="text-3xl font-bold text-coreed-moss-bright mb-2">
              {likeCount}
            </div>
            <div className="text-coreed-sage">
              Total Likes
            </div>
          </div>
        </div>

        {/* Actions */}
        {isConnected && (
          <div className="mt-8 pt-8 border-t border-coreed-line/30">
            <h2 className="text-lg font-semibold text-coreed-bone mb-4">
              Actions
            </h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleDeploy}
                disabled={deploying}
                className="px-4 py-3 bg-coreed-moss hover:bg-coreed-moss-bright disabled:bg-coreed-line disabled:cursor-not-allowed text-coreed-void rounded-md text-sm font-medium transition-colors touch-manipulation active:scale-[0.98] min-h-[44px]"
              >
                {deploying ? "Deploying..." : <><Rocket className="inline-block w-4 h-4 mr-1 -mt-0.5" /> Deploy Space</>}
              </button>
              <button
                onClick={handleLike}
                className="px-4 py-3 bg-coreed-panel-raised border border-coreed-line/30 text-coreed-bone rounded-md text-sm font-medium hover:border-coreed-moss transition-colors touch-manipulation active:scale-[0.98] min-h-[44px]"
              >
                <Heart className="inline-block w-4 h-4 mr-1 -mt-0.5" /> {liked ? "Unlike" : "Like"}
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-3 bg-coreed-panel-raised border border-coreed-line/30 text-coreed-bone rounded-md text-sm font-medium hover:border-coreed-moss transition-colors touch-manipulation active:scale-[0.98] min-h-[44px]"
              >
                <Download className="inline-block w-4 h-4 mr-1 -mt-0.5" /> Download
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}