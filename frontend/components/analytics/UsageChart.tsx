"use client";

import { useEffect, useRef, useState } from "react";

export interface ChartData {
  label: string;
  value: number;
  timestamp: number;
}

interface ChartProps {
  data: ChartData[];
  title?: string;
  height?: number;
  type?: "bar" | "line" | "area";
  color?: string;
}

const DEFAULT_COLOR = "#5b7a62";
const SECONDARY_COLOR = "#8fb89a";

/**
 * Simple SVG-based chart component for usage analytics
 * Lightweight alternative to heavy charting libraries
 */
export function UsageChart({
  data,
  title,
  height = 200,
  type = "line",
  color = DEFAULT_COLOR
}: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || data.length === 0) {
    return (
      <div className="bg-coreed-panel-raised border border-coreed-line/30 rounded-lg p-6">
        {title && (
          <h3 className="text-sm font-semibold text-coreed-bone mb-4">{title}</h3>
        )}
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-coreed-sage/50 text-sm">No data available</p>
        </div>
      </div>
    );
  }

  // Calculate chart dimensions and scaling
  const width = 400;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = (height || 200) - margin.top - margin.bottom;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const valueRange = maxValue - minValue;

  // Scale functions
  const scaleX = (index: number) => margin.left + (index / (data.length - 1)) * chartWidth;
  const scaleY = (value: number) => 
    margin.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  // Generate path for line/area chart
  const generatePath = () => {
    if (data.length === 0) return "";
    
    const points = data.map((_, i) => `${scaleX(i)},${scaleY(data[i].value)}`).join(" ");
    return `M ${points}`;
  };

  // Generate path for area chart
  const generateAreaPath = () => {
    if (data.length === 0) return "";
    
    const points = data.map((_, i) => `${scaleX(i)},${scaleY(data[i].value)}`).join(" ");
    const bottomLine = data.map((_, i) => `${scaleX(i)},${margin.top + chartHeight}`).join(" ");
    return `M ${points} L ${bottomLine} Z`;
  };

  // Format value for display
  const formatValue = (value: number) => {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
    if (value >= 1000) return (value / 1000).toFixed(1) + "K";
    return value.toString();
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-coreed-panel-raised border border-coreed-line/30 rounded-lg p-4">
      {title && (
        <h3 className="text-sm font-semibold text-coreed-bone mb-3">{title}</h3>
      )}
      
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
      >
        {/* Background grid lines */}
        {type !== "bar" && (
          <>
            {Array.from({ length: 4 }).map((_, i) => {
              const y = margin.top + (i / 3) * chartHeight;
              const value = maxValue - (i / 3) * valueRange;
              return (
                <line
                  key={`grid-${i}`}
                  x1={margin.left}
                  y1={y}
                  x2={width - margin.right}
                  y2={y}
                  stroke="#2a2e2b"
                  strokeDasharray="2,2"
                />
              );
            })}
          </>
        )}

        {/* X-axis */}
        <line
          x1={margin.left}
          y1={margin.top + chartHeight}
          x2={width - margin.right}
          y2={margin.top + chartHeight}
          stroke="#2a2e2b"
        />

        {/* Y-axis */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={margin.top + chartHeight}
          stroke="#2a2e2b"
        />

        {/* Chart data */}
        {type === "bar" ? (
          data.map((d, i) => (
            <rect
              key={`bar-${i}`}
              x={scaleX(i) - (chartWidth / data.length / 2) * 0.8}
              y={scaleY(d.value)}
              width={(chartWidth / data.length) * 0.8}
              height={margin.top + chartHeight - scaleY(d.value)}
              fill={color}
              rx={2}
              ry={2}
            />
          ))
        ) : type === "area" ? (
          <path d={generateAreaPath()} fill={color} opacity={0.3} />
        ) : (
          <>
            {/* Line */}
            <path
              d={generatePath()}
              fill="none"
              stroke={color}
              strokeWidth={2}
            />
            {/* Points */}
            {data.map((d, i) => (
              <circle
                key={`point-${i}`}
                cx={scaleX(i)}
                cy={scaleY(d.value)}
                r={4}
                fill={color}
                stroke="#151916"
                strokeWidth={1}
              />
            ))}
          </>
        )}

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % Math.ceil(data.length / 4) !== 0 && data.length > 4) return null;
          return (
            <text
              key={`label-x-${i}`}
              x={scaleX(i)}
              y={margin.top + chartHeight + 20}
              textAnchor="middle"
              fill="#7a8b7e"
              fontSize={10}
            >
              {formatTime(d.timestamp)}
            </text>
          );
        })}

        {/* Y-axis labels */}
        {Array.from({ length: 4 }).map((_, i) => {
          const value = maxValue - (i / 3) * valueRange;
          return (
            <text
              key={`label-y-${i}`}
              x={margin.left - 10}
              y={margin.top + (i / 3) * chartHeight}
              textAnchor="end"
              dominantBaseline="middle"
              fill="#7a8b7e"
              fontSize={10}
            >
              {formatValue(value)}
            </text>
          );
        })}
      </svg>

      {/* Legend/Info */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs text-coreed-sage/70">{formatValue(maxValue)} max</span>
        </div>
        <span className="text-xs text-coreed-sage/70">{data.length} data points</span>
      </div>
    </div>
  );
}

/**
 * Request count chart component
 */
export function RequestChart({ data }: { data: ChartData[] }) {
  return (
    <UsageChart
      data={data}
      title="Requests Over Time"
      type="line"
      color="#8fb89a"
      height={200}
    />
  );
}

/**
 * Performance latency chart
 */
export function LatencyChart({ data }: { data: ChartData[] }) {
  return (
    <UsageChart
      data={data}
      title="Response Latency"
      type="area"
      color="#c97b4a"
      height={200}
    />
  );
}

/**
 * Health status over time (binary active/inactive)
 */
export function HealthTimeline({ data }: { data: { timestamp: number; isActive: boolean }[] }) {
  const chartData: ChartData[] = data.map(d => ({
    label: d.isActive ? "Active" : "Inactive",
    value: d.isActive ? 1 : 0,
    timestamp: d.timestamp
  }));

  return (
    <UsageChart
      data={chartData}
      title="Health Status Timeline"
      type="line"
      color="#5b7a62"
      height={150}
    />
  );
}
