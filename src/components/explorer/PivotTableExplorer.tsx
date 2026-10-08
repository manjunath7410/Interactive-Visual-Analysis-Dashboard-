import React, { useState, useMemo } from 'react';
import {
  Table as TableIcon,
  Sliders,
  Layers,
  ArrowUpDown,
  Download,
  Sparkles,
  Grid,
} from 'lucide-react';
import { DatasetAnalytics } from '../../types/dataset';
import { formatNumberShort, formatMetricDisplay, normalizeRowValue } from '../../utils/dataEngine';
import { useTheme } from '../../context/ThemeContext';

interface PivotTableExplorerProps {
  filteredRows: Record<string, any>[];
  analytics: DatasetAnalytics;
}

type AggregatorType = 'sum' | 'avg' | 'count' | 'min' | 'max';

export const PivotTableExplorer: React.FC<PivotTableExplorerProps> = ({
  filteredRows,
  analytics,
}) => {
  const { theme } = useTheme();
  const catCols = analytics.categoricalColumnNames;
  const numCols = analytics.numericColumnNames;

  const [rowDim, setRowDim] = useState<string>(catCols[0] || '');
  const [colDim, setColDim] = useState<string>(catCols[1] || catCols[0] || '');
  const [valMetric, setValMetric] = useState<string>(numCols[0] || '');
  const [aggregator, setAggregator] = useState<AggregatorType>('sum');

  // Compute Pivot Cross-Tabulation Matrix
  const pivotMatrix = useMemo(() => {
    if (!rowDim || !colDim || filteredRows.length === 0) {
      return null;
    }

    const rowKeysSet = new Set<string>();
    const colKeysSet = new Set<string>();
    const cellValues: Record<string, Record<string, number[]>> = {};

    for (const r of filteredRows) {
      const rKey = String(r[rowDim] || 'Unassigned').trim();
      const cKey = String(r[colDim] || 'Unassigned').trim();
      const v = valMetric ? normalizeRowValue(r[valMetric], 'number') : 1;

      rowKeysSet.add(rKey);
      colKeysSet.add(cKey);

      if (!cellValues[rKey]) cellValues[rKey] = {};
      if (!cellValues[rKey][cKey]) cellValues[rKey][cKey] = [];

      if (v !== null && !isNaN(v)) {
        cellValues[rKey][cKey].push(v);
      }
    }

    const rowKeys = Array.from(rowKeysSet).slice(0, 15); // Top 15 rows
    const colKeys = Array.from(colKeysSet).slice(0, 8); // Top 8 cols

    const aggregateArr = (arr: number[]): number => {
      if (!arr || arr.length === 0) return 0;
      if (aggregator === 'count') return arr.length;
      if (aggregator === 'sum') return arr.reduce((a, b) => a + b, 0);
      if (aggregator === 'avg') return arr.reduce((a, b) => a + b, 0) / arr.length;
      if (aggregator === 'min') return Math.min(...arr);
      if (aggregator === 'max') return Math.max(...arr);
      return 0;
    };

    let maxVal = 0;
    const grid: Record<string, Record<string, number>> = {};
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};

    for (const rk of rowKeys) {
      grid[rk] = {};
      let rSum = 0;

      for (const ck of colKeys) {
        const rawArr = cellValues[rk]?.[ck] || [];
        const aggVal = aggregateArr(rawArr);
        grid[rk][ck] = aggVal;
        rSum += aggVal;
        colTotals[ck] = (colTotals[ck] || 0) + aggVal;

        if (aggVal > maxVal) maxVal = aggVal;
      }
      rowTotals[rk] = rSum;
    }

    const grandTotal = Object.values(rowTotals).reduce((a, b) => a + b, 0);

    return {
      rowKeys,
      colKeys,
      grid,
      rowTotals,
      colTotals,
      grandTotal,
      maxVal: maxVal || 1,
    };
  }, [filteredRows, rowDim, colDim, valMetric, aggregator]);

  if (catCols.length === 0) {
    return null;
  }

  return (
    <div className={`w-full rounded-2xl ${theme.classes.bgPanel} border ${theme.classes.border} p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-4`}>
      {/* Header & Dimensions Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Multi-Dimensional Pivot Matrix
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                OLAP Cross-Tab
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cross-tabulate metrics across intersecting categorical dimensions
            </p>
          </div>
        </div>

        {/* Pivot Selectors */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Row Dimension */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1">
            <span className="text-[10px] text-slate-500 font-mono pl-1.5">Rows:</span>
            <select
              value={rowDim}
              onChange={(e) => setRowDim(e.target.value)}
              className="bg-slate-900 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-700/80 focus:outline-none focus:border-cyan-500"
            >
              {catCols.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          {/* Col Dimension */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1">
            <span className="text-[10px] text-slate-500 font-mono pl-1.5">Cols:</span>
            <select
              value={colDim}
              onChange={(e) => setColDim(e.target.value)}
              className="bg-slate-900 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-700/80 focus:outline-none focus:border-cyan-500"
            >
              {catCols.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          {/* Metric */}
          {numCols.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1">
              <span className="text-[10px] text-slate-500 font-mono pl-1.5">Metric:</span>
              <select
                value={valMetric}
                onChange={(e) => setValMetric(e.target.value)}
                className="bg-slate-900 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-700/80 focus:outline-none focus:border-cyan-500"
              >
                {numCols.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Aggregator */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
            {(['sum', 'avg', 'count'] as AggregatorType[]).map((agg) => (
              <button
                key={agg}
                onClick={() => setAggregator(agg)}
                className={`px-2 py-1 text-[10px] font-mono uppercase font-bold rounded-lg transition-colors ${
                  aggregator === agg
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {agg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pivot Matrix Table */}
      {pivotMatrix ? (
        <div className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                <th className="p-3 font-semibold text-slate-200 uppercase tracking-wider sticky left-0 bg-slate-900 z-10">
                  {rowDim} \ {colDim}
                </th>
                {pivotMatrix.colKeys.map((ck) => (
                  <th key={ck} className="p-3 font-semibold text-right whitespace-nowrap">
                    {ck}
                  </th>
                ))}
                <th className="p-3 font-bold text-right text-cyan-300 bg-slate-900/80">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {pivotMatrix.rowKeys.map((rk) => {
                const rowTotal = pivotMatrix.rowTotals[rk] || 0;

                return (
                  <tr key={rk} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-medium text-slate-200 sticky left-0 bg-slate-950/90 whitespace-nowrap">
                      {rk}
                    </td>

                    {pivotMatrix.colKeys.map((ck) => {
                      const val = pivotMatrix.grid[rk]?.[ck] || 0;
                      const heatRatio = pivotMatrix.maxVal > 0 ? val / pivotMatrix.maxVal : 0;

                      return (
                        <td
                          key={ck}
                          className="p-3 text-right tabular-nums text-slate-300"
                          style={{
                            backgroundColor:
                              val > 0
                                ? `rgba(56, 189, 248, ${Math.min(0.35, Math.max(0.04, heatRatio * 0.35))})`
                                : undefined,
                          }}
                        >
                          {aggregator === 'count'
                            ? val.toLocaleString()
                            : formatMetricDisplay(val, valMetric)}
                        </td>
                      );
                    })}

                    <td className="p-3 text-right font-bold text-white bg-slate-900/40 tabular-nums">
                      {aggregator === 'count'
                        ? rowTotal.toLocaleString()
                        : formatMetricDisplay(rowTotal, valMetric)}
                    </td>
                  </tr>
                );
              })}

              {/* Column Totals Row */}
              <tr className="bg-slate-900/90 text-cyan-300 font-bold border-t border-slate-700">
                <td className="p-3 sticky left-0 bg-slate-900">Total</td>
                {pivotMatrix.colKeys.map((ck) => (
                  <td key={ck} className="p-3 text-right tabular-nums">
                    {aggregator === 'count'
                      ? (pivotMatrix.colTotals[ck] || 0).toLocaleString()
                      : formatMetricDisplay(pivotMatrix.colTotals[ck] || 0, valMetric)}
                  </td>
                ))}
                <td className="p-3 text-right text-emerald-400 font-extrabold tabular-nums">
                  {aggregator === 'count'
                    ? pivotMatrix.grandTotal.toLocaleString()
                    : formatMetricDisplay(pivotMatrix.grandTotal, valMetric)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-slate-400">
          Select categorical dimensions to generate cross-tabulation matrix.
        </div>
      )}
    </div>
  );
};
