"use client";

import { useState, useEffect } from "react";
import type { SleepConfig } from "@/types/space";
import { useAgentSpaceRegistry } from "@/lib/useAgentSpaceRegistry";

interface SleepStatusProps {
  spaceId: string | number;
  isAsleep: boolean;
  sleepTimeout: number;
  lastActivity: number;
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  if (seconds === 0) return "Disabled";
  
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

// Helper function to format time until sleep
function formatTimeUntilSleep(seconds: number): string {
  if (seconds <= 0) return "Sleeping";
  return formatDuration(seconds);
}

// Helper function to calculate time since last activity
function calculateTimeSinceActivity(lastActivityTimestamp: number): number {
  if (lastActivityTimestamp === 0) return 0;
  const now = Math.floor(Date.now() / 1000);
  return now - lastActivityTimestamp;
}

// Helper function to calculate time until sleep
function calculateTimeUntilSleep(
  lastActivityTimestamp: number,
  sleepTimeout: number
): number {
  if (sleepTimeout === 0) return 0; // Sleep disabled
  if (lastActivityTimestamp === 0) return 0;
  
  const now = Math.floor(Date.now() / 1000);
  const timeSinceActivity = now - lastActivityTimestamp;
  const timeUntilSleep = sleepTimeout - timeSinceActivity;
  
  return Math.max(0, timeUntilSleep);
}

export function SleepStatus({
  spaceId,
  isAsleep,
  sleepTimeout,
  lastActivity,
}: SleepStatusProps) {
  const { getSleepStatus } = useAgentSpaceRegistry();
  const [sleepConfig, setSleepConfig] = useState<SleepConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch sleep status on mount
  useEffect(() => {
    const fetchSleepStatus = async () => {
      try {
        setLoading(true);
        const config = await getSleepStatus(spaceId);
        setSleepConfig(config);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch sleep status");
      } finally {
        setLoading(false);
      }
    };

    fetchSleepStatus();

    // Refresh every 30 seconds
    const interval = setInterval(fetchSleepStatus, 30000);
    return () => clearInterval(interval);
  }, [spaceId, getSleepStatus]);

  // Use provided props if sleepConfig not yet loaded
  const displayIsAsleep = sleepConfig ? sleepConfig.isAsleep : isAsleep;
  const displaySleepTimeout = sleepConfig ? sleepConfig.sleepTimeout : sleepTimeout;
  const displayTimeUntilSleep = sleepConfig 
    ? sleepConfig.timeUntilSleep 
    : calculateTimeUntilSleep(lastActivity, displaySleepTimeout);

  const timeSinceActivity = calculateTimeSinceActivity(lastActivity);

  // Determine status
  const getStatusInfo = () => {
    if (displayIsAsleep) {
      return {
        label: "Asleep",
        color: "text-coreed-rose",
        bgColor: "bg-coreed-rose/10",
        borderColor: "border-coreed-rose/30",
      };
    }
    
    if (displaySleepTimeout === 0) {
      return {
        label: "Sleep Disabled",
        color: "text-coreed-sage",
        bgColor: "bg-coreed-sage/10",
        borderColor: "border-coreed-sage/30",
      };
    }
    
    return {
      label: "Active",
      color: "text-coreed-moss",
      bgColor: "bg-coreed-moss/10",
      borderColor: "border-coreed-moss/30",
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex items-center gap-2">
      <div
        className={`px-2 py-1 rounded border text-xs font-mono ${statusInfo.bgColor} ${statusInfo.borderColor} ${statusInfo.color}`}
      >
        {statusInfo.label}
      </div>
      
      {displaySleepTimeout > 0 && !displayIsAsleep && (
        <span
          className="font-mono text-xs text-coreed-sage/70"
          title={`Time until auto-sleep: ${formatDuration(displayTimeUntilSleep)}`}
        >
          ⏳ {formatTimeUntilSleep(displayTimeUntilSleep)}
        </span>
      )}
      
      {displayIsAsleep && displaySleepTimeout > 0 && (
        <span
          className="font-mono text-xs text-coreed-sage/70"
          title={`Asleep for ${formatDuration(timeSinceActivity)}`}
        >
          💤 {formatDuration(timeSinceActivity)}
        </span>
      )}
    </div>
  );
}

// Standalone sleep badge component
interface SleepBadgeProps {
  isAsleep: boolean;
  sleepTimeout: number;
  className?: string;
}

export function SleepBadge({ isAsleep, sleepTimeout, className = "" }: SleepBadgeProps) {
  const statusInfo = isAsleep
    ? {
        label: "💤 Asleep",
        color: "text-coreed-rose",
        bgColor: "bg-coreed-rose/10",
        borderColor: "border-coreed-rose/30",
      }
    : sleepTimeout === 0
    ? {
        label: "☀️ Always On",
        color: "text-coreed-moss",
        bgColor: "bg-coreed-moss/10",
        borderColor: "border-coreed-moss/30",
      }
    : {
        label: "⏳ Auto-Sleep",
        color: "text-coreed-gold",
        bgColor: "bg-coreed-gold/10",
        borderColor: "border-coreed-gold/30",
      };

  return (
    <span
      className={`px-2 py-0.5 rounded border text-xs font-mono ${statusInfo.bgColor} ${statusInfo.borderColor} ${statusInfo.color} ${className}`}
    >
      {statusInfo.label}
      {sleepTimeout > 0 && !isAsleep && (
        <span className="ml-1 text-coreed-sage/70">
          ({formatDuration(sleepTimeout)})
        </span>
      )}
    </span>
  );
}

// Sleep configuration display
interface SleepConfigDisplayProps {
  sleepTimeout: number;
  autoSleep: boolean;
  autoWake: boolean;
}

export function SleepConfigDisplay({
  sleepTimeout,
  autoSleep,
  autoWake,
}: SleepConfigDisplayProps) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-coreed-sage/70">Sleep Timeout:</span>
        <span className="font-mono text-coreed-bone">
          {formatDuration(sleepTimeout)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-coreed-sage/70">Auto-Sleep:</span>
        <span className={`font-mono ${autoSleep ? "text-coreed-moss" : "text-coreed-rose"}`}>
          {autoSleep ? "✓ Enabled" : "✗ Disabled"}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-coreed-sage/70">Auto-Wake:</span>
        <span className={`font-mono ${autoWake ? "text-coreed-moss" : "text-coreed-rose"}`}>
          {autoWake ? "✓ Enabled" : "✗ Disabled"}
        </span>
      </div>
    </div>
  );
}
