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
    <div className="rounded border border-coreed-line bg-coreed-panel p-5 hover:border-coreed-moss transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-coreed-line flex items-center justify-center">
            <span className="font-mono text-xs text-coreed-sage">🤖</span>
          </div>
          <div>
            <h3 className="font-mono text-sm font-medium text-coreed-bone">
              {space.name}
            </h3>
            <p className="font-mono text-xs text-coreed-sage">
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

      <p className="mb-4 text-sm leading-relaxed text-coreed-sage/80 line-clamp-2">
        {space.description || "No description provided"}
      </p>

      <div className="flex items-center justify-between text-xs">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="font-mono text-coreed-sage/70">
            Model: {model.name}
          </span>
          <span className="font-mono text-coreed-sage/70">
            Requests: {space.requestCount}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-coreed-line/50">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-coreed-sage">
            Space ID: {space.spaceId}
          </span>
          <Link
            href={`/spaces/${space.spaceId}`}
            className="font-mono text-xs text-coreed-moss-bright hover:text-coreed-bone"
          >
            view details →
          </Link>
        </div>
      </div>
    </div>
  );
}

