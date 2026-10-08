import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Layers, Calendar, Eye, EyeOff } from 'lucide-react';
import { DatasetAnalytics } from '../../types/dataset';
import { formatNumberShort, formatMetricDisplay, normalizeRowValue } from '../../utils/dataEngine';
import { useTheme } from '../../context/ThemeContext';

interface LineTrendChartProps {
  filteredRows: Record<string, any>[];
  analytics: DatasetAnalytics;
}

export const LineTrendChart: React.FC<LineTrendChartProps> = ({
  filteredRows,
  analytics,
}) => {
  const { theme } = useTheme();
  const dateCol = analytics.primaryDateColumn;
  const numCols = analytics.numericColumnNames;

  const [selectedYCol, setSelectedYCol] = useState<string>(
    analytics.primaryNumericColumn || (numCols[0] ?? '')
  );
  const [showAreaFill, setShowAreaFill] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Prepare aggregated time series data
  const chartData = useMemo(() => {
    if (!selectedYCol || filteredRows.length === 0) return [];

    if (dateCol) {
      // Group by date or month
      const map: Record<string, { sum: number; count: number }> = {};
      for (const r of filteredRows) {
        const d = String(r[dateCol] || '').split('T')[0];
        if (!d) continue;
        const v = normalizeRowValue(r[selectedYCol], 'number');
        if (v === null || isNaN(v)) continue;

        if (!map[d]) {
          map[d] = { sum: 0, count: 0 };
        }
        map[d].sum += v;
        map[d].count += 1;
      }

      const sortedDates = Object.keys(map).sort();
      // If too many points (> 40), downsample evenly for clean SVG rendering
      const step = Math.max(1, Math.floor(sortedDates.length / 32));
      const sampled: { label: string; value: number }[] = [];

      for (let i = 0; i < sortedDates.length; i += step) {
        const d = sortedDates[i];
        sampled.push({
          label: d,
          value: Number((map[d].sum / (map[d].count || 1)).toFixed(2)),
        });
      }
      return sampled;
    } else {
      // Use sequential row intervals
      const step = Math.max(1, Math.floor(filteredRows.length / 30));
      const sampled: { label: string; value: number }[] = [];
      for (let i = 0; i < filteredRows.length; i += step) {
        const v = normalizeRowValue(filteredRows[i][selectedYCol], 'number');
        sampled.push({
          label: `#${i + 1}`,
          value: v === null || isNaN(v) ? 0 : v,
        });
      }
      return sampled;
    }
  }, [filteredRows, selectedYCol, dateCol]);

  if (chartData.length < 2) {
    return (
      <div className="w-full h-80 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col items-center justify-center text-slate-400">
        <TrendingUp className="w-8 h-8 text-slate-600 mb-2" />
        <span className="text-sm">Insufficient temporal data to display trend chart</span>
      </div>
    );
  }

  // Calculate SVG bounds & coordinates
  const values = chartData.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const svgWidth = 800;
  const svgHeight = 260;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartInnerWidth = svgWidth - paddingLeft - paddingRight;
  const chartInnerHeight = svgHeight - paddingTop - paddingBottom;

  const points = chartData.map((d, idx) => {
    const x = paddingLeft + (idx / (chartData.length - 1)) * chartInnerWidth;
    const y = paddingTop + chartInnerHeight - ((d.value - minVal) / range) * chartInnerHeight;
    return { x, y, ...d };
  });

  // Construct smooth bezier curve path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartInnerHeight} L ${points[0].x} ${paddingTop + chartInnerHeight} Z`;

  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div data-layer="base" className={`w-full h-full flex flex-col justify-between ${theme.classes.bgPanel} border ${theme.classes.border} rounded-2xl p-5 sm:p-6 shadow-lg backdrop-blur-md`}>
      {/* Header with Title and Metric Selector */}
      <div data-layer="fg" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white tracking-tight">
              Temporal Trend & Velocity
            </h3>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${theme.classes.badgeStyle}`}>
              {dateCol ? `Over ${dateCol}` : 'Sequential Progression'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic longitudinal trajectory across active filtered cohort
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Metric Selector Dropdown */}
          <select
            value={selectedYCol}
            onChange={(e) => setSelectedYCol(e.target.value)}
            className="h-8 inline-flex items-center bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 focus:outline-none focus:border-indigo-500 shrink-0"
          >
            {numCols.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>

          {/* Area Toggle Button */}
          <button
            onClick={() => setShowAreaFill(!showAreaFill)}
            title="Toggle gradient area"
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors shrink-0"
          >
            {showAreaFill ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div data-layer="viz" className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width * svgWidth;
            // find closest point
            let closestIdx = 0;
            let minDist = Infinity;
            points.forEach((p, idx) => {
              const dist = Math.abs(p.x - relX);
              if (dist < minDist) {
                minDist = dist;
                closestIdx = idx;
              }
            });
            setHoverIndex(closestIdx);
          }}
        >
          <defs>
            <linearGradient id="lineTrendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.trendGradients.fillColor} stopOpacity="0.45" />
              <stop offset="100%" stopColor={theme.trendGradients.fillColor} stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={theme.trendGradients.strokeFrom} />
              <stop offset="50%" stopColor={theme.trendGradients.strokeMid} />
              <stop offset="100%" stopColor={theme.trendGradients.strokeTo} />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = paddingTop + chartInnerHeight * (1 - pct);
            const val = minVal + range * pct;
            return (
              <g key={pct}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#334155"
                  strokeOpacity="0.4"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  {formatNumberShort(val)}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {showAreaFill && (
            <path d={areaD} fill="url(#lineTrendGrad)" />
          )}

          {/* Main Smooth Line */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#strokeGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Hover Point & Guideline */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={paddingTop}
                x2={hoveredPoint.x}
                y2={paddingTop + chartInnerHeight}
                stroke="#818cf8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="6"
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* Bottom X-Axis Labels */}
          {points
            .filter((_, idx) => idx % Math.ceil(points.length / 6) === 0)
            .map((p, idx) => (
              <text
                key={idx}
                x={p.x}
                y={svgHeight - 12}
                textAnchor="middle"
                fill="#64748b"
                fontSize="10"
                fontFamily="var(--font-mono)"
              >
                {p.label.length > 10 ? p.label.slice(5) : p.label}
              </text>
            ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute pointer-events-none bg-slate-900/95 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs shadow-xl backdrop-blur-md z-20"
            style={{
              left: `${(hoveredPoint.x / svgWidth) * 100}%`,
              top: `${(hoveredPoint.y / svgHeight) * 100}%`,
              transform: 'translate(-50%, -125%)',
            }}
          >
            <div className="text-[10px] text-slate-400 font-mono mb-0.5">
              {hoveredPoint.label}
            </div>
            <div className="text-white font-bold tabular-nums">
              {formatMetricDisplay(hoveredPoint.value, selectedYCol)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
