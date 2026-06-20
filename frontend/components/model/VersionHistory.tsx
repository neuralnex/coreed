"use client";

import Link from "next/link";
import { useState } from "react";
import type { ModelVersion, VersionHistory } from "@/types/model";

interface VersionHistoryProps {
  modelId: string;
  history: VersionHistory;
  currentVersion: string;
  onRollback: (versionId: string) => Promise<void>;
  canManage: boolean;
}

export function VersionHistoryComponent({
  modelId,
  history,
  currentVersion,
  onRollback,
  canManage
}: VersionHistoryProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const sortedVersions = [...history.versions].sort((a, b) => 
    b.createdAt - a.createdAt
  );

  const handleRollback = async (versionId: string) => {
    if (!canManage) return;

    setLoading(versionId);
    setError(null);

    try {
      await onRollback(versionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rollback");
    } finally {
      setLoading(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="bg-coreed-panel-raised border border-coreed-line/30 rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-coreed-line/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📜</span>
          <div>
            <h3 className="font-semibold text-coreed-bone">Version History</h3>
            <p className="text-sm text-coreed-sage/70">{sortedVersions.length} versions • Current: v{currentVersion}</p>
          </div>
        </div>
        <span className="text-coreed-sage">{expanded ? "←" : "→"}</span>
      </button>

      {expanded && (
        <div className="p-4 border-t border-coreed-line/30">
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-700 rounded-md mb-4">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {sortedVersions.map((version, index) => {
              const isLatest = version.isLatest;
              const isCurrent = version.version === currentVersion;

              return (
                <div
                  key={version.versionId}
                  className={`p-3 rounded-lg border border-coreed-line/30 ${isLatest ? "bg-coreed-moss/10" : "bg-coreed-panel"}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-coreed-bone/70">v{version.version}</span>
                        {isLatest && (
                          <span className="px-2 py-0.5 bg-coreed-moss/20 text-coreed-moss-bright text-xs rounded-full">
                            Latest
                          </span>
                        )}
                        {isCurrent && !isLatest && (
                          <span className="px-2 py-0.5 bg-coreed-sage/20 text-coreed-sage text-xs rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-coreed-bone mt-1">{version.name}</p>
                      <p className="text-xs text-coreed-sage/70 mt-1 line-clamp-2">
                        {version.description || "No description"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-coreed-sage/50">
                        <span>Updated {formatDate(version.createdAt)}</span>
                        <span>•</span>
                        <span>{formatTime(version.createdAt)}</span>
                        <span>•</span>
                        <span className="font-mono">by {version.createdBy.slice(0, 6)}...</span>
                      </div>
                      {version.changes && (
                        <p className="text-xs text-coreed-sage/60 mt-2">
                          Changes: {version.changes}
                        </p>
                      )}
                      <p className="text-xs text-coreed-sage/50 font-mono mt-1">
                        Storage: {version.storageRootHash.slice(0, 10)}...
                      </p>
                    </div>

                    {canManage && !isLatest && (
                      <button
                        onClick={() => handleRollback(version.versionId)}
                        disabled={loading === version.versionId}
                        className="px-3 py-1.5 bg-coreed-panel-raised border border-coreed-line/30 text-coreed-bone hover:border-coreed-moss text-xs rounded transition-colors disabled:opacity-50"
                      >
                        {loading === version.versionId ? "Rolling back..." : "Rollback"}
                      </button>
                    )}
                  </div>

                  {index < sortedVersions.length - 1 && (
                    <div className="h-px bg-coreed-line/20" />
                  )}
                </div>
              );
            })}
          </div>

          {canManage && (
            <div className="mt-4 pt-4 border-t border-coreed-line/30">
              <Link
                href={`/hub/models/${modelId}/versions/new`}
                className="inline-block px-4 py-2 bg-coreed-moss hover:bg-coreed-moss-bright text-coreed-void rounded text-sm transition-colors"
              >
                + Create New Version
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
