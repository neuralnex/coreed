"use client";

import Link from "next/link";
import { ResolvingHash } from "../ResolvingHash";
import type { ModelMeta } from "@/types/model";

interface ModelCardProps {
  model: ModelMeta;
}

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
  const now = new Date();
  const created = new Date(timestamp * 1000);
  const diff = now.getTime() - created.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return created.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getArchitectureColor = (arch: string): string => {
  const colors: Record<string, string> = {
    "Qwen2.5": "text-modal-green",
    "Llama3": "text-white/80",
    "Mistral": "text-modal-text-dim",
    "Phi-3": "text-white",
    "Gemma": "text-modal-green/80"
  };
  return colors[arch] || "text-modal-text-dim";
};

export function ModelCard({ model }: ModelCardProps) {
  const shortHash = model.storageRootHash.slice(0, 10) + "..." + model.storageRootHash.slice(-6);

  return (
    <Link
      href={`/hub/models/${model.modelId}`}
      className="modal-card hover:border-modal-green transition-all duration-200"
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-sans text-base font-semibold text-white truncate">
            {model.name}
          </h3>
          <p className={`font-mono text-xs mt-1 ${getArchitectureColor(model.architecture)}`}>
            {model.architecture}
          </p>
        </div>
        <span className="font-mono text-xs text-modal-text-dim bg-white/5 px-2 py-0.5 rounded border border-white/5">
          #{model.modelId}
        </span>
      </div>

      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-modal-text-dim">
        {model.description || "No description provided."}
      </p>

      <div className="mb-4 flex items-center gap-4">
        <span className="font-mono text-xs text-modal-text-dim">
          {formatNumber(model.parameters)} params
        </span>
        <span className="font-mono text-xs text-modal-text-dim">
          {model.license}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-mono text-xs text-modal-text-dim">
            <span className="text-modal-green">♻️</span>
            {formatNumber(model.downloadCount)}
          </span>
          <span className="flex items-center gap-1 font-mono text-xs text-modal-text-dim">
            <span className="text-red-400">❤️</span>
            {formatNumber(model.likeCount)}
          </span>
        </div>
        <span className="font-mono text-xs text-modal-text-dim/80">
          {formatDate(model.createdAt)}
        </span>
      </div>
    </Link>
  );
}
