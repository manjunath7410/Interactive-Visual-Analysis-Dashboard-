import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart3, ArrowUpDown, Filter } from 'lucide-react';
import { DatasetAnalytics } from '../../types/dataset';
import { formatNumberShort, formatMetricDisplay, normalizeRowValue } from '../../utils/dataEngine';
import { useTheme } from '../../context/ThemeContext';

interface CategoryBarChartProps {
  filteredRows: Record<string, any>[];
  analytics: DatasetAnalytics;
  onCategoryFilter?: (col: string, val: string) => void;
  activeCategoryFilters?: Record<string, string[]>;
}

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({
  filteredRows,
  analytics,
  onCategoryFilter,
  activeCategoryFilters,
}) => {
  const { theme } = useTheme();
  const palette = theme.chartPalette;
  const catCols = analytics.categoricalColumnNames;
  const numCols = analytics.numericColumnNames;

  const [selectedCatCol, setSelectedCatCol] = useState<string>(
    analytics.primaryCategoricalColumn || (catCols[0] ?? '')
  );
  const [selectedNumCol, setSelectedNumCol] = useState<string>(
    analytics.primaryNumericColumn || (numCols[0] ?? '')
  );
  const [aggregation, setAggregation] = useState<'sum' | 'mean' | 'count'>('sum');
  const [sortAsc, setSortAsc] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Group and aggregate
  const barData = useMemo(() => {
    if (!selectedCatCol || filteredRows.length === 0) return [];

    const map: Record<string, { sum: number; count: number }> = {};
    for (const r of filteredRows) {
      const cat = String(r[selectedCatCol] || 'Unspecified').trim();
      const parsedNum = selectedNumCol ? normalizeRowValue(r[selectedNumCol], 'number') : 1;
      const validNum = parsedNum === null || isNaN(parsedNum) ? 0 : parsedNum;

      if (!map[cat]) {
        map[cat] = { sum: 0, count: 0 };
      }
      map[cat].sum += validNum;
      map[cat].count += 1;
    }

    const items = Object.entries(map).map(([category, stats]) => {
      let value = 0;
      if (aggregation === 'sum') value = stats.sum;
      else if (aggregation === 'mean') value = stats.count > 0 ? stats.sum / stats.count : 0;
      else value = stats.count;

      return {
        category,
        value: Number(value.toFixed(2)),
        count: stats.count,
        sum: stats.sum,
      };
    });

    items.sort((a, b) => (sortAsc ? a.value - b.value : b.value - a.value));
    return items.slice(0, 10); // Show top 10 categories
  }, [filteredRows, selectedCatCol, selectedNumCol, aggregation, sortAsc]);

  const totalSum = barData.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const maxValue = Math.max(...barData.map((d) => d.value), 1);

  if (barData.length === 0) {
    return (
      <div className="w-full h-80 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col items-center justify-center text-slate-400">
        <BarChart3 className="w-8 h-8 text-slate-600 mb-2" />
        <span className="text-sm">No categorical dimensions available</span>
      </div>
    );
  }

  return (
    <div data-layer="base" className={`w-full h-full flex flex-col justify-between ${theme.classes.bgPanel} border ${theme.classes.border} rounded-2xl p-5 sm:p-6 shadow-lg backdrop-blur-md`}>
      {/* Header Controls */}
      <div data-layer="fg" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Categorical Performance Ranking
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparative distribution across {selectedCatCol}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dimension Selector */}
          <select
            value={selectedCatCol}
            onChange={(e) => setSelectedCatCol(e.target.value)}
            className="h-8 inline-flex items-center bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 focus:outline-none focus:border-indigo-500 shrink-0"
          >
            {catCols.map((c) => (
              <option key={c} value={c}>
                Group: {c}
              </option>
            ))}
          </select>

          {/* Metric Selector */}
          {aggregation !== 'count' && (
            <select
              value={selectedNumCol}
              onChange={(e) => setSelectedNumCol(e.target.value)}
              className="h-8 inline-flex items-center bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 focus:outline-none focus:border-indigo-500 shrink-0"
            >
              {numCols.map((m) => (
                <option key={m} value={m}>
                  Metric: {m}
                </option>
              ))}
            </select>
          )}

          {/* Aggregation Mode Segmented Control */}
          <div className="h-8 inline-flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs shrink-0">
            <button
              onClick={() => setAggregation('sum')}
              className={`h-full px-2.5 inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                aggregation === 'sum' ? `${theme.classes.accentPrimary} text-white` : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sum
            </button>
            <button
              onClick={() => setAggregation('mean')}
              className={`h-full px-2.5 inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                aggregation === 'mean' ? `${theme.classes.accentPrimary} text-white` : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Avg
            </button>
            <button
              onClick={() => setAggregation('count')}
              className={`h-full px-2.5 inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                aggregation === 'count' ? `${theme.classes.accentPrimary} text-white` : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Count
            </button>
          </div>

          {/* Sort Order Toggle Button */}
          <button
            onClick={() => setSortAsc(!sortAsc)}
            title="Toggle sort direction"
            className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors shrink-0"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Bar Chart Rows */}
      <div data-layer="viz" className="space-y-3 pt-1">
        {barData.map((item, idx) => {
          const widthPct = Math.max(4, Math.round((item.value / maxValue) * 100));
          const sharePct = ((item.value / totalSum) * 100).toFixed(1);
          const color = palette[idx % palette.length];
          const isHovered = hoveredCategory === item.category;
          const isSelected = activeCategoryFilters?.[selectedCatCol]?.includes(item.category);

          return (
            <div
              key={item.category}
              onClick={() => onCategoryFilter?.(selectedCatCol, item.category)}
              onMouseEnter={() => setHoveredCategory(item.category)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={`group relative p-2 rounded-xl transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500/15 border border-cyan-500/40 shadow-sm'
                  : isHovered
                  ? 'bg-slate-800/60'
                  : 'hover:bg-slate-800/30'
              }`}
              title="Click to cross-filter dashboard by this segment"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-200 truncate max-w-[200px] sm:max-w-xs flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  {item.category}
                  {isSelected && (
                    <span className="text-[10px] font-mono text-cyan-300 font-semibold px-1.5 rounded bg-cyan-500/20">
                      Filtered
                    </span>
                  )}
                </span>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {sharePct}% share
                  </span>
                  <span className="font-bold text-white tabular-nums font-mono">
                    {aggregation === 'count'
                      ? `${item.value.toLocaleString()} records`
                      : formatMetricDisplay(item.value, selectedNumCol)}
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.04 }}
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: color,
                    boxShadow: isHovered ? `0 0 12px ${color}80` : 'none',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
