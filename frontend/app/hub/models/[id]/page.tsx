"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { StatusStrip } from "@/components/StatusStrip";
import { ResolvingHash } from "@/components/ResolvingHash";
import { useModelRegistry } from "@/lib/useModelRegistry";
import { useAgentRegistry } from "@/lib/useAgentRegistry";
import { GALILEO_EXPLORER_URL } from "@/lib/wallet";
import type { ModelMeta } from "@/types/model";
import type { JsonRpcSigner } from "ethers";

export default function ModelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const modelId = params.id as string;
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [model, setModel] = useState<ModelMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isCreator, setIsCreator] = useState(false);

  const { getModel, likeModel, unlikeModel, checkLike, recordDownload, error } = useModelRegistry();
  const { launchAgent } = useAgentRegistry();

  useEffect(() => {
    const fetchModel = async () => {
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
    };
    fetchModel();
  }, [modelId, getModel, checkLike, address]);

  const handleLike = async () => {
    if (!signer || !model) return;
    
    try {
      if (liked) {
        await unlikeModel(model.modelId, signer);
        setLiked(false);
        setLikeCount(likeCount - 1);
      } else {
        await likeModel(model.modelId, signer);
        setLiked(true);
        setLikeCount(likeCount + 1);
      }
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  const handleDownload = async () => {
    if (!model) return;
    
    try {
      await recordDownload(model.modelId);
      setModel({ ...model, downloadCount: model.downloadCount + 1 });
    } catch (err) {
      console.error("Download record failed:", err);
    }
  };

  const handleLaunchAgent = async () => {
    if (!signer || !model) return;
    
    try {
      const { agentId } = await launchAgent(signer, model.name, model.storageRootHash);
      router.push(`/?newAgent=${agentId}`);
    } catch (err) {
      console.error("Agent launch failed:", err);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(1) + "B";
    }
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + "M";
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <>
        <StatusStrip
          address={address}
          onConnect={(s, addr) => {
            setSigner(s);
            setAddress(addr);
          }}
        />
        <main className="mx-auto flex max-w-4xl flex-1 flex-col px-6 py-12">
          <p className="font-mono text-coreed-sage coreed-pulse">Loading model...</p>
        </main>
      </>
    );
  }

  if (!model) {
    return (
      <>
        <StatusStrip
          address={address}
          onConnect={(s, addr) => {
            setSigner(s);
            setAddress(addr);
          }}
        />
        <main className="mx-auto flex max-w-4xl flex-1 flex-col px-6 py-12">
          <p className="font-mono text-coreed-clay">Model not found.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <StatusStrip
        address={address}
        onConnect={(s, addr) => {
          setSigner(s);
          setAddress(addr);
        }}
      />

      <main className="mx-auto flex max-w-4xl flex-1 flex-col px-6 py-12">
        <div className="mb-6">
          <div className="flex items-baseline gap-4">
            <Link
              href="/hub/search"
              className="font-mono text-xs text-coreed-sage hover:text-coreed-bone"
            >
              ← All Models
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-baseline gap-3">
            <h1 className="font-mono text-2xl font-medium tracking-tight text-coreed-bone">
              {model.name}
            </h1>
            <span className="font-mono text-xs text-coreed-sage">
              v1.0
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-coreed-sage">
            {model.description || "No description provided."}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded border border-coreed-clay bg-coreed-panel-raised p-4">
            <p className="font-mono text-xs text-coreed-clay" role="alert">
              {error}
            </p>
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="coreed-panel rounded-lg p-6">
            <h2 className="mb-4 font-mono text-xs uppercase tracking-wide text-coreed-sage">
              Model Details
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="font-mono text-xs text-coreed-sage">Architecture</dt>
                <dd className="font-mono text-sm text-coreed-bone">{model.architecture}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-coreed-sage">Parameters</dt>
                <dd className="font-mono text-sm text-coreed-bone">
                  {formatNumber(model.parameters)}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-coreed-sage">License</dt>
                <dd className="font-mono text-sm text-coreed-bone">{model.license}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-coreed-sage">Storage Hash</dt>
                <dd className="font-mono text-sm">
                  <ResolvingHash value={model.storageRootHash} pending={false} />
                </dd>
              </div>
            </dl>
          </div>

          <div className="coreed-panel rounded-lg p-6">
            <h2 className="mb-4 font-mono text-xs uppercase tracking-wide text-coreed-sage">
              Statistics
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="font-mono text-xs text-coreed-sage">Downloads</dt>
                <dd className="font-mono text-sm text-coreed-bone">
                  {formatNumber(model.downloadCount)}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-coreed-sage">Likes</dt>
                <dd className="font-mono text-sm text-coreed-bone">{formatNumber(likeCount)}</dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-coreed-sage">Created</dt>
                <dd className="font-mono text-sm text-coreed-bone">
                  {formatDate(model.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-coreed-sage">Creator</dt>
                <dd className="font-mono text-sm text-coreed-bone truncate">
                  {model.creator.slice(0, 10)}...{model.creator.slice(-8)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={handleLike}
            disabled={!address}
            className={`rounded border px-3 py-1.5 font-mono text-xs transition-colors ${
              liked
                ? "border-coreed-moss-bright bg-coreed-panel-raised text-coreed-moss-bright"
                : "border-coreed-line bg-transparent text-coreed-bone hover:border-coreed-moss"
            } disabled:opacity-50`}
          >
            {liked ? "❤️ Liked" : "♡ Like"}
          </button>
          <button
            onClick={handleDownload}
            className="rounded border border-coreed-line bg-transparent px-3 py-1.5 font-mono text-xs text-coreed-bone transition-colors hover:border-coreed-moss hover:text-coreed-moss-bright"
          >
            ↓ Download
          </button>
          <button
            onClick={handleLaunchAgent}
            disabled={!address}
            className="rounded border border-coreed-line bg-coreed-panel-raised px-3 py-1.5 font-mono text-xs text-coreed-bone transition-colors hover:border-coreed-moss disabled:opacity-50"
          >
            ✏️ Launch Agent
          </button>
          {isCreator && (
            <Link
              href={`/hub/models/${model.modelId}/edit`}
              className="rounded border border-coreed-line px-3 py-1.5 font-mono text-xs text-coreed-sage hover:border-coreed-moss hover:text-coreed-bone"
            >
              ⚙️ Edit
            </Link>
          )}
          <a
            href={`${GALILEO_EXPLORER_URL}/address/${model.creator}`}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-coreed-line px-3 py-1.5 font-mono text-xs text-coreed-sage hover:border-coreed-moss hover:text-coreed-bone"
          >
            🔍 View Creator
          </a>
        </div>

        <div className="coreed-panel rounded-lg p-6">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-wide text-coreed-sage">
            About This Model
          </h2>
          <p className="text-sm leading-relaxed text-coreed-sage">
            This model is stored on 0G Storage, a decentralized storage network.
            The Merkle root hash above serves as cryptographic proof of the model's
            integrity. Only the 32-byte hash is stored on-chain, while the full model
            data is distributed across 0G's storage nodes.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-coreed-sage">
            You can download this model and use it locally, or launch an agent
            that uses this model to provide inference services.
          </p>
        </div>
      </main>
    </>
  );
}
