"use client";

import Link from "next/link";
import { HealthBadge } from "./HealthBadge";
import { SleepBadge } from "./SleepStatus";
import type { SpaceDeployment } from "@/types/space";
import type { JsonRpcSigner } from "ethers";

interface SpaceCardProps {
  deployment: SpaceDeployment;
  signer: JsonRpcSigner | null;
  showSleepStatus?: boolean;
}

export function SpaceCard({ deployment, signer, showSleepStatus = true }: SpaceCardProps) {
  const space = deployment.space;
  const model = deployment.model;
  
  return (
    <div className="modal-card hover:border-modal-green transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-white/5 flex items-center justify-center bg-white/5">
            <span className="font-mono text-xs text-modal-text-dim">🤖</span>
          </div>
          <div>
            <h3 className="font-sans text-base font-semibold text-white">
              {space.name}
            </h3>
            <p className="font-mono text-xs text-modal-text-dim mt-0.5">
              v{space.version}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HealthBadge isActive={space.isActive} lastChecked={space.lastHealthCheck} />
          {showSleepStatus && (
            <SleepBadge 
              isAsleep={space.isAsleep} 
              sleepTimeout={space.sleepTimeout} 
            />
          )}
        </div>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-modal-text-dim line-clamp-2">
        {space.description || "No description provided"}
      </p>

      <div className="flex items-center justify-between text-xs">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="font-mono text-modal-text-dim">
            Model: {model.name}
          </span>
          <span className="font-mono text-modal-text-dim">
            Requests: {space.requestCount}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-modal-text-dim">
            Space ID: {space.spaceId}
          </span>
          <Link
            href={`/spaces/${space.spaceId}`}
            className="font-mono text-xs text-modal-green hover:text-white transition-colors"
          >
            view details →
          </Link>
        </div>
      </div>
    </div>
  );
}

