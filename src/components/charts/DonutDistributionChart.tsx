import React, { useState, useMemo } from 'react';
import { PieChart, PieChart as PieIcon, Layers } from 'lucide-react';
import { DatasetAnalytics } from '../../types/dataset';
import { formatNumberShort } from '../../utils/dataEngine';
import { useTheme } from '../../context/ThemeContext';

interface DonutDistributionChartProps {
  filteredRows: Record<string, any>[];
  analytics: DatasetAnalytics;
  onCategoryFilter?: (col: string, val: string) => void;
  activeCategoryFilters?: Record<string, string[]>;
}

export const DonutDistributionChart: React.FC<DonutDistributionChartProps> = ({
  filteredRows,
  analytics,
  onCategoryFilter,
  activeCategoryFilters,
}) => {
  const { theme } = useTheme();
  const palette = theme.chartPalette;
  const catCols = analytics.categoricalColumnNames;
  // Pick secondary categorical or primary
  const defaultCat =
    catCols.length > 1 ? catCols[1] : analytics.primaryCategoricalColumn || catCols[0];
  const [selectedCol, setSelectedCol] = useState<string>(defaultCat || '');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Group counts
  const distributionData = useMemo(() => {
    if (!selectedCol || filteredRows.length === 0) return [];

    const counts: Record<string, number> = {};
    for (const r of filteredRows) {
      const val = String(r[selectedCol] || 'Unassigned').trim();
      counts[val] = (counts[val] || 0) + 1;
    }

    const sorted = Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    // Group items after top 6 into "Other"
    if (sorted.length > 6) {
      const topItems = sorted.slice(0, 5);
      const otherCount = sorted.slice(5).reduce((acc, curr) => acc + curr.count, 0);
      topItems.push({ label: 'Other', count: otherCount });
      return topItems;
    }

    return sorted;
  }, [filteredRows, selectedCol]);

  const totalCount = distributionData.reduce((acc, curr) => acc + curr.count, 0);

  // Generate SVG donut arcs
  const radius = 80;
  const innerRadius = 54;
  const cx = 110;
  const cy = 110;

  let cumulativeAngle = -Math.PI / 2;
  const slices = distributionData.map((d, idx) => {
    const angle = totalCount > 0 ? (d.count / totalCount) * (2 * Math.PI) : 0;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const ix1 = cx + innerRadius * Math.cos(endAngle);
    const iy1 = cy + innerRadius * Math.sin(endAngle);
    const ix2 = cx + innerRadius * Math.cos(startAngle);
    const iy2 = cy + innerRadius * Math.sin(startAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    const pathData = `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${ix1} ${iy1}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2}
      Z
    `;

    const percentage = totalCount > 0 ? ((d.count / totalCount) * 100).toFixed(1) : '0';

    return {
      ...d,
      pathData,
      color: palette[idx % palette.length],
      percentage,
    };
  });

  const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div data-layer="base" className={`w-full h-full flex flex-col justify-between ${theme.classes.bgPanel} border ${theme.classes.border} rounded-2xl p-5 sm:p-6 shadow-lg backdrop-blur-md`}>
      <div data-layer="fg" className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Distribution Breakdown
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Proportional share across {selectedCol}
          </p>
        </div>

        {catCols.length > 0 && (
          <select
            value={selectedCol}
            onChange={(e) => setSelectedCol(e.target.value)}
            className="h-8 inline-flex items-center bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 focus:outline-none focus:border-indigo-500"
          >
            {catCols.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      <div data-layer="viz" className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
        {/* Donut SVG */}
        <div className="relative w-56 h-56 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 220 220" className="w-full h-full select-none">
            {slices.map((slice, idx) => {
              const isHovered = hoveredIndex === idx;
              const isSelected = activeCategoryFilters?.[selectedCol]?.includes(slice.label);

              return (
                <path
                  key={slice.label}
                  d={slice.pathData}
                  fill={slice.color}
                  opacity={hoveredIndex === null || isHovered || isSelected ? 1 : 0.4}
                  stroke={isSelected ? '#38bdf8' : '#0f172a'}
                  strokeWidth={isSelected ? '3.5' : '2.5'}
                  className="transition-all duration-200 cursor-pointer"
                  onClick={() => slice.label !== 'Other' && onCategoryFilter?.(selectedCol, slice.label)}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    transform: isHovered || isSelected ? 'scale(1.04)' : 'scale(1)',
                    transformOrigin: `${cx}px ${cy}px`,
                  }}
                />
              );
            })}
          </svg>

          {/* Center Donut Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              {activeSlice ? activeSlice.label : 'Total Cohort'}
            </span>
            <span className="text-lg font-bold text-white tabular-nums font-mono">
              {activeSlice
                ? `${activeSlice.percentage}%`
                : totalCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">
              {activeSlice ? `${activeSlice.count} units` : 'Records'}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="w-full space-y-2 max-h-56 overflow-y-auto pr-1">
          {slices.map((slice, idx) => {
            const isHovered = hoveredIndex === idx;
            const isSelected = activeCategoryFilters?.[selectedCol]?.includes(slice.label);

            return (
              <div
                key={slice.label}
                onClick={() => slice.label !== 'Other' && onCategoryFilter?.(selectedCol, slice.label)}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-cyan-500/20 text-white border border-cyan-500/40'
                    : isHovered
                    ? 'bg-slate-800/80 text-white'
                    : 'hover:bg-slate-800/40 text-slate-300'
                }`}
                title="Click to cross-filter dashboard by this segment"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="truncate font-medium">{slice.label}</span>
                  {isSelected && (
                    <span className="text-[10px] text-cyan-300 font-mono px-1 rounded bg-cyan-500/20">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono">
                  <span className="text-slate-400">{slice.count.toLocaleString()}</span>
                  <span className="font-bold text-white w-12 text-right">
                    {slice.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
