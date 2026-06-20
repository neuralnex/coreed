"use client";

import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  trend?: number; // percentage change
  color?: string;
}

/**
 * Simple statistics card for displaying key metrics
 */
export function StatsCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  color = "#5b7a62"
}: StatsCardProps) {
  const trendColor = trend && trend > 0 ? "#8fb89a" : trend && trend < 0 ? "#c97b4a" : "#7a8b7e";
  const trendSymbol = trend && trend > 0 ? "↑" : trend && trend < 0 ? "↓" : "→";

  return (
    <div className="bg-coreed-panel-raised border border-coreed-line/30 rounded-lg p-5 min-w-[150px] flex-1">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-coreed-bone" style={{ color }}>
              {value}
            </h3>
            {trend !== undefined && (
              <span className="text-xs" style={{ color: trendColor }}>
                {trendSymbol} {Math.abs(trend)}%
              </span>
            )}
          </div>
          <p className="text-sm text-coreed-sage/70 mt-1">{title}</p>
          {subtitle && (
            <p className="text-xs text-coreed-sage/50 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Group of statistics cards arranged horizontally or in a grid
 */
export function StatCardGroup({
  children,
  cols = 4
}: {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
}) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4"
  };

  return (
    <div className={`grid gap-4 ${gridCols[cols] || gridCols[4]} md:grid-cols-${cols}`}>
      {children}
    </div>
  );
}
