"use client";

import { useState } from "react";
import { useAgentSpaceRegistry } from "@/lib/useAgentSpaceRegistry";
import type { JsonRpcSigner } from "ethers";

interface SleepControlsProps {
  spaceId: string | number;
  signer: JsonRpcSigner | null;
  isAsleep: boolean;
  isPaused: boolean;
  onActionComplete?: () => void;
}

export function SleepControls({
  spaceId,
  signer,
  isAsleep,
  isPaused,
  onActionComplete,
}: SleepControlsProps) {
  const {
    pauseSpace,
    resumeSpace,
    wakeSpace,
    setSleepTimeout,
  } = useAgentSpaceRegistry();

  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [newTimeout, setNewTimeout] = useState<string>("");

  const handleAction = async (
    action: "pause" | "resume" | "wake",
    actionFn: () => Promise<void>
  ) => {
    if (!signer) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setIsLoading(action);
      setError(null);
      await actionFn();
      onActionComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setIsLoading(null);
    }
  };

  const handlePause = () => {
    handleAction("pause", async () => {
      await pauseSpace(signer!, spaceId);
    });
  };

  const handleResume = () => {
    handleAction("resume", async () => {
      await resumeSpace(signer!, spaceId);
    });
  };

  const handleWake = () => {
    handleAction("wake", async () => {
      await wakeSpace(signer!, spaceId);
    });
  };

  const handleSetTimeout = async () => {
    if (!signer || !newTimeout) return;

    try {
      setIsLoading("timeout");
      setError(null);
      const timeoutSeconds = parseInt(newTimeout);
      
      if (isNaN(timeoutSeconds) || timeoutSeconds < 0) {
        setError("Please enter a valid number (seconds)");
        return;
      }

      await setSleepTimeout(signer, spaceId, timeoutSeconds);
      setShowTimeoutModal(false);
      setNewTimeout("");
      onActionComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set sleep timeout");
    } finally {
      setIsLoading(null);
    }
  };

  // Determine which buttons to show
  const getButtons = () => {
    const buttons = [];

    // Always show timeout configuration
    buttons.push(
      <button
        key="timeout"
        onClick={() => setShowTimeoutModal(true)}
        disabled={isLoading !== null}
        className="px-3 py-1.5 text-xs font-mono rounded border border-coreed-line text-coreed-bone hover:bg-coreed-panel-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ⏰ Set Timeout
      </button>
    );

    // If active (not asleep, not paused)
    if (!isAsleep && !isPaused) {
      buttons.push(
        <button
          key="pause"
          onClick={handlePause}
          disabled={isLoading !== null}
          className="px-3 py-1.5 text-xs font-mono rounded border border-coreed-gold/50 text-coreed-gold hover:bg-coreed-gold/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading === "pause" ? "⏳ Pausing..." : "⏸️ Pause"}
        </button>
      );
    }

    // If paused or asleep
    if (isPaused || isAsleep) {
      buttons.push(
        <button
          key="resume"
          onClick={isPaused ? handleResume : handleWake}
          disabled={isLoading !== null}
          className="px-3 py-1.5 text-xs font-mono rounded border border-coreed-moss/50 text-coreed-moss hover:bg-coreed-moss/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading === "resume" || isLoading === "wake" 
            ? "⏳ Waking..." 
            : isPaused 
              ? "▶️ Resume" 
              : "🌅 Wake"}
        </button>
      );
    }

    return buttons;
  };

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {getButtons()}
      </div>

      {error && (
        <p className="mt-2 text-xs text-coreed-rose">{error}</p>
      )}

      {/* Sleep Timeout Modal */}
      {showTimeoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-coreed-panel border border-coreed-line rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-mono text-coreed-bone mb-4">
              Set Sleep Timeout
            </h3>
            <p className="text-sm text-coreed-sage/70 mb-4">
              Time in seconds before space automatically sleeps due to inactivity.
              Set to 0 to disable auto-sleep.
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-coreed-sage/70 mb-1">
                  Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={newTimeout}
                  onChange={(e) => setNewTimeout(e.target.value)}
                  placeholder="3600 (60 minutes)"
                  min="0"
                  className="w-full px-3 py-2 bg-coreed-bg border border-coreed-line rounded text-coreed-bone font-mono focus:outline-none focus:border-coreed-moss"
                />
              </div>
              
              <div className="flex items-center gap-2 text-xs text-coreed-sage/70">
                <span>Presets:</span>
                <button
                  onClick={() => setNewTimeout("300")}
                  className="px-2 py-0.5 bg-coreed-panel-hover rounded text-coreed-sage"
                >
                  5m
                </button>
                <button
                  onClick={() => setNewTimeout("1800")}
                  className="px-2 py-0.5 bg-coreed-panel-hover rounded text-coreed-sage"
                >
                  30m
                </button>
                <button
                  onClick={() => setNewTimeout("3600")}
                  className="px-2 py-0.5 bg-coreed-panel-hover rounded text-coreed-sage"
                >
                  60m
                </button>
                <button
                  onClick={() => setNewTimeout("7200")}
                  className="px-2 py-0.5 bg-coreed-panel-hover rounded text-coreed-sage"
                >
                  120m
                </button>
                <button
                  onClick={() => setNewTimeout("0")}
                  className="px-2 py-0.5 bg-coreed-rose/10 text-coreed-rose rounded"
                >
                  Disable
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowTimeoutModal(false);
                  setNewTimeout("");
                  setError(null);
                }}
                className="px-4 py-2 text-sm font-mono rounded border border-coreed-line text-coreed-sage hover:bg-coreed-panel-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetTimeout}
                disabled={isLoading !== null}
                className="px-4 py-2 text-sm font-mono rounded bg-coreed-moss/20 border border-coreed-moss/50 text-coreed-moss hover:bg-coreed-moss/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading === "timeout" ? "⏳ Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Inline sleep toggle for quick access
interface SleepToggleProps {
  spaceId: string | number;
  signer: JsonRpcSigner | null;
  isAsleep: boolean;
  sleepTimeout: number;
  onToggle?: () => void;
}

export function SleepToggle({
  spaceId,
  signer,
  isAsleep,
  sleepTimeout,
  onToggle,
}: SleepToggleProps) {
  const { wakeSpace, pauseSpace } = useAgentSpaceRegistry();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (!signer) return;

    try {
      setIsLoading(true);
      if (isAsleep) {
        await wakeSpace(signer, spaceId);
      } else {
        await pauseSpace(signer, spaceId);
      }
      onToggle?.();
    } catch (err) {
      // Error handled by parent or silently
    } finally {
      setIsLoading(false);
    }
  };

  if (sleepTimeout === 0) return null; // Sleep disabled

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className="p-1.5 rounded border border-coreed-line hover:bg-coreed-panel-hover transition-colors disabled:opacity-50"
      title={isAsleep ? "Wake space" : "Pause space"}
    >
      {isLoading ? (
        <span className="text-coreed-gold animate-pulse">⏳</span>
      ) : isAsleep ? (
        <span className="text-coreed-moss">▶️</span>
      ) : (
        <span className="text-coreed-gold">⏸️</span>
      )}
    </button>
  );
}
