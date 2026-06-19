"use client";

import { useEffect, useState } from "react";

interface HealthBadgeProps {
  isActive: boolean;
  lastChecked: number;
}

export function HealthBadge({ isActive, lastChecked }: HealthBadgeProps) {
  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() / 1000) - lastChecked);
      
      if (seconds < 60) {
        setTimeAgo("just now");
      } else if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        setTimeAgo(`${mins}m ago`);
      } else if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        setTimeAgo(`${hours}h ago`);
      } else {
        const days = Math.floor(seconds / 86400);
        setTimeAgo(`${days}d ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [lastChecked]);

  if (isActive) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="font-mono text-xs text-green-400">
          {timeAgo || "checking..."}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-red-400" />
      <span className="font-mono text-xs text-red-400">
        inactive
      </span>
    </div>
  );
}
